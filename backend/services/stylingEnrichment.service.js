import { Clothes, User } from "../models/Users.js";
import { redis } from "../libs/redis.client.js";
import {
  clampFormalityToStyleCategory,
  defaultStylingMetadata,
  hasRichStylingFields,
  normalizeClothingAnalysisResponse,
} from "../utils/normalizeClothingAnalysisResponse.js";
import {
  OCCASION_TAGS,
  STYLE_CATEGORIES,
} from "../constants/clothingMetadata.js";
import { logError, logInfo } from "../observability/logger.js";
import { fetchClothingAnalysisRaw } from "./aiClothing.service.js";

const WORKFLOW = "clothing_styling_enrichment";

/** Processing older than this is considered stale and may be claimed/retried. */
export const ENRICHMENT_STALE_MS = Number(
  process.env.STYLE_ENRICHMENT_STALE_MS || 5 * 60 * 1000,
);

/** Minimum gap between authenticated retry requests for one item. */
export const ENRICHMENT_RETRY_COOLDOWN_MS = Number(
  process.env.STYLE_ENRICHMENT_RETRY_COOLDOWN_MS || 60 * 1000,
);

/** Cap on authenticated retries per clothing item. */
export const ENRICHMENT_MAX_RETRIES = Number(
  process.env.STYLE_ENRICHMENT_MAX_RETRIES || 5,
);

export const ensureStylingMetadata = (doc) => {
  if (!doc.stylingMetadata) {
    doc.stylingMetadata = defaultStylingMetadata();
  }
  if (!doc.stylingMetadata.confidence) {
    doc.stylingMetadata.confidence = defaultStylingMetadata().confidence;
  }
  if (!Array.isArray(doc.stylingMetadata.occasionTags)) {
    doc.stylingMetadata.occasionTags = [];
  }
  return doc.stylingMetadata;
};

const invalidateClothesCache = async (userId) => {
  try {
    const user = await User.findById(userId).select("auth0Id");
    if (user?.auth0Id) {
      await redis.del("userClothes:" + user.auth0Id);
      await redis.del("userOutfits:" + user.auth0Id);
    }
  } catch (err) {
    console.warn("Redis delete failed after styling enrichment:", err);
  }
};

export const isEnrichmentStale = (meta, now = new Date()) => {
  if (!meta || meta.enrichmentStatus !== "processing") return false;
  if (!meta.processingStartedAt) return true;
  const started = new Date(meta.processingStartedAt).getTime();
  if (Number.isNaN(started)) return true;
  return now.getTime() - started >= ENRICHMENT_STALE_MS;
};

/**
 * Atomically claim an enrichment job. Returns null if another worker owns it.
 */
export const claimEnrichmentJob = async (
  clothingId,
  { force = false } = {},
) => {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - ENRICHMENT_STALE_MS);

  const orClauses = [
    { "stylingMetadata.enrichmentStatus": { $in: ["pending", "failed"] } },
    { "stylingMetadata.enrichmentStatus": { $exists: false } },
    { stylingMetadata: { $exists: false } },
    {
      "stylingMetadata.enrichmentStatus": "processing",
      $or: [
        { "stylingMetadata.processingStartedAt": { $lte: staleBefore } },
        { "stylingMetadata.processingStartedAt": null },
        { "stylingMetadata.processingStartedAt": { $exists: false } },
      ],
    },
  ];

  if (force) {
    orClauses.push({ "stylingMetadata.enrichmentStatus": "completed" });
  }

  return Clothes.findOneAndUpdate(
    { _id: clothingId, $or: orClauses },
    {
      $set: {
        "stylingMetadata.enrichmentStatus": "processing",
        "stylingMetadata.processingStartedAt": now,
        "stylingMetadata.enrichmentError": null,
      },
      $inc: { "stylingMetadata.enrichmentAttemptCount": 1 },
    },
    { new: true },
  );
};

/**
 * Applies AI enrichment without overwriting user-sourced fields.
 * Legacy responses without rich styling fields leave status pending.
 * Uses a targeted update so legacy documents missing required core fields
 * (material/fit/pattern) do not fail full-document validation.
 */
export const applyAiStylingEnrichment = async ({
  clothingId,
  analysis,
  force = false,
}) => {
  const clothing = await Clothes.findById(clothingId).lean();
  if (!clothing) {
    return { clothing: null, skipped: true, reason: "deleted" };
  }

  const meta = {
    ...defaultStylingMetadata(),
    ...(clothing.stylingMetadata || {}),
    confidence: {
      ...defaultStylingMetadata().confidence,
      ...(clothing.stylingMetadata?.confidence || {}),
    },
    occasionTags: Array.isArray(clothing.stylingMetadata?.occasionTags)
      ? [...clothing.stylingMetadata.occasionTags]
      : [],
  };

  const styling = analysis?.styling || {};
  const rich = hasRichStylingFields(styling);

  if (meta.enrichmentStatus === "completed" && !force && rich) {
    const current = await Clothes.findById(clothingId);
    return { clothing: current, skipped: true, reason: "already_completed" };
  }

  if (meta.styleCategorySource !== "user") {
    if (styling.styleCategory != null) {
      meta.styleCategory = styling.styleCategory;
      meta.styleCategorySource = "ai";
    }
  }

  if (meta.occasionTagsSource !== "user") {
    if (Array.isArray(styling.occasionTags)) {
      meta.occasionTags = styling.occasionTags;
      if (styling.occasionTags.length > 0) {
        meta.occasionTagsSource = "ai";
      }
    }
  }

  if (styling.formalityScore != null) {
    meta.formalityScore = styling.formalityScore;
  }
  if (styling.statementLevel != null) {
    meta.statementLevel = styling.statementLevel;
  }
  if (styling.outfitRole != null) {
    meta.outfitRole = styling.outfitRole;
  }

  // Keep user-chosen styleCategory coherent with formality.
  if (meta.styleCategorySource === "user" && meta.styleCategory) {
    meta.formalityScore = clampFormalityToStyleCategory(
      meta.styleCategory,
      meta.formalityScore,
    );
  }

  meta.confidence = {
    ...defaultStylingMetadata().confidence,
    ...(styling.confidence || {}),
  };
  meta.enrichmentError = null;
  meta.processingStartedAt = null;

  if (rich) {
    meta.enrichmentStatus = "completed";
    meta.enrichedAt = new Date();
  } else {
    // Legacy FastAPI: core tags may exist, but rich enrichment is not done.
    meta.enrichmentStatus = "pending";
    meta.enrichedAt = null;
  }

  const updated = await Clothes.findByIdAndUpdate(
    clothingId,
    { $set: { stylingMetadata: meta } },
    { new: true, runValidators: false },
  );
  if (!updated) {
    return { clothing: null, skipped: true, reason: "deleted" };
  }

  await invalidateClothesCache(updated.userId);

  return {
    clothing: updated,
    skipped: false,
    rich,
    reason: rich ? "completed" : "legacy_no_rich_fields",
  };
};

/**
 * User-owned edits for styleCategory / occasionTags only.
 */
export const updateUserStyleDetails = async ({
  clothingId,
  uniqueId,
  userId,
  styleCategory,
  occasionTags,
}) => {
  let clothing = null;
  if (clothingId) {
    clothing = await Clothes.findById(clothingId);
  } else if (uniqueId) {
    const objectIdLike = /^(?=.*[a-f\d])[a-f\d]{24}$/i;
    if (objectIdLike.test(String(uniqueId))) {
      clothing = await Clothes.findById(uniqueId);
    }
    if (!clothing) {
      clothing = await Clothes.findOne({ uniqueId: String(uniqueId) });
    }
  }

  if (!clothing || String(clothing.userId) !== String(userId)) {
    throw { status: 404, message: "Clothing item not found" };
  }

  const meta = ensureStylingMetadata(clothing);
  let changed = false;

  if (styleCategory !== undefined) {
    if (styleCategory === null || styleCategory === "") {
      meta.styleCategory = null;
      meta.styleCategorySource = "user";
      changed = true;
    } else if (STYLE_CATEGORIES.includes(styleCategory)) {
      meta.styleCategory = styleCategory;
      meta.styleCategorySource = "user";
      meta.formalityScore = clampFormalityToStyleCategory(
        styleCategory,
        meta.formalityScore,
      );
      changed = true;
    } else {
      throw { status: 400, message: "Invalid styleCategory" };
    }
  }

  if (occasionTags !== undefined) {
    if (!Array.isArray(occasionTags)) {
      throw { status: 400, message: "occasionTags must be an array" };
    }
    const cleaned = [];
    const seen = new Set();
    for (const tag of occasionTags) {
      if (!OCCASION_TAGS.includes(tag)) {
        throw { status: 400, message: `Invalid occasionTag: ${tag}` };
      }
      if (seen.has(tag)) continue;
      seen.add(tag);
      cleaned.push(tag);
    }
    meta.occasionTags = cleaned;
    meta.occasionTagsSource = "user";
    changed = true;
  }

  if (changed) {
    meta.userReviewedAt = new Date();
    clothing.markModified("stylingMetadata");
    await clothing.save();
    await invalidateClothesCache(clothing.userId);
  }

  return clothing;
};

const markEnrichmentFailed = async (clothingId, safeMessage) => {
  const existing = await Clothes.findById(clothingId).lean();
  if (!existing) return null;

  const failedMeta = {
    ...defaultStylingMetadata(),
    ...(existing.stylingMetadata || {}),
    confidence: {
      ...defaultStylingMetadata().confidence,
      ...(existing.stylingMetadata?.confidence || {}),
    },
    occasionTags: Array.isArray(existing.stylingMetadata?.occasionTags)
      ? [...existing.stylingMetadata.occasionTags]
      : [],
    enrichmentStatus: "failed",
    enrichmentError: safeMessage,
    processingStartedAt: null,
  };

  const failed = await Clothes.findByIdAndUpdate(
    clothingId,
    { $set: { stylingMetadata: failedMeta } },
    { new: true, runValidators: false },
  );
  if (!failed) return null;

  await invalidateClothesCache(failed.userId);
  return failed;
};

/**
 * Idempotent enrichment job with atomic claim.
 */
export const enrichClothingStyling = async (
  clothingId,
  { force = false } = {},
) => {
  const claimed = await claimEnrichmentJob(clothingId, { force });
  if (!claimed) {
    const existing = await Clothes.findById(clothingId);
    if (!existing) {
      logInfo("styling.enrichment.skipped", {
        workflow: WORKFLOW,
        reason: "not_found",
        clothingId: String(clothingId),
      });
      return null;
    }
    logInfo("styling.enrichment.skipped", {
      workflow: WORKFLOW,
      reason: "claim_failed",
      clothingId: String(clothingId),
      status: existing.stylingMetadata?.enrichmentStatus,
    });
    return existing;
  }

  try {
    if (!claimed.imageSrc) {
      throw new Error("Missing image for enrichment");
    }

    const { data: raw } = await fetchClothingAnalysisRaw(claimed.imageSrc, {
      workflow: WORKFLOW,
    });

    // Item may have been deleted while FastAPI was running.
    const stillExists = await Clothes.findById(clothingId).select("_id");
    if (!stillExists) {
      logInfo("styling.enrichment.skipped", {
        workflow: WORKFLOW,
        reason: "deleted",
        clothingId: String(clothingId),
      });
      return null;
    }

    const analysis = normalizeClothingAnalysisResponse(raw);
    const result = await applyAiStylingEnrichment({
      clothingId,
      analysis,
      force,
    });

    if (result.reason === "deleted") {
      logInfo("styling.enrichment.skipped", {
        workflow: WORKFLOW,
        reason: "deleted",
        clothingId: String(clothingId),
      });
      return null;
    }

    // A completed FastAPI call that still lacks rich fields should not stay
    // forever in "pending" (UI shows Analyzing…). Mark failed so the user can
    // retry later after the model is upgraded.
    if (result.reason === "legacy_no_rich_fields") {
      await markEnrichmentFailed(clothingId, "Style analysis unavailable");
      logInfo("styling.enrichment.completed", {
        workflow: WORKFLOW,
        clothingId: String(clothingId),
        rich: false,
        validTagCount: analysis.validTagCount,
        outcome: "legacy_marked_failed",
      });
      return Clothes.findById(clothingId);
    }

    logInfo("styling.enrichment.completed", {
      workflow: WORKFLOW,
      clothingId: String(clothingId),
      rich: result.rich,
      validTagCount: analysis.validTagCount,
    });

    return result.clothing;
  } catch (error) {
    const exists = await Clothes.findById(clothingId).select("_id");
    if (!exists) {
      logInfo("styling.enrichment.skipped", {
        workflow: WORKFLOW,
        reason: "deleted",
        clothingId: String(clothingId),
      });
      return null;
    }

    const safeMessage = "Style analysis unavailable";
    try {
      await markEnrichmentFailed(clothingId, safeMessage);
    } catch (persistError) {
      logError("styling.enrichment.persist_failed", {
        workflow: WORKFLOW,
        errorMessage: persistError?.message,
      });
    }

    logError("styling.enrichment.failed", {
      workflow: WORKFLOW,
      clothingId: String(clothingId),
      errorMessage: error?.message,
    });

    return null;
  }
};

/**
 * Fire-and-forget schedule. All promise rejections are logged and persisted.
 */
export const scheduleStylingEnrichment = (clothingId, options = {}) => {
  setImmediate(() => {
    Promise.resolve()
      .then(() => enrichClothingStyling(clothingId, options))
      .catch(async (error) => {
        logError("styling.enrichment.unhandled", {
          workflow: WORKFLOW,
          clothingId: String(clothingId),
          errorMessage: error?.message,
        });
        try {
          const exists = await Clothes.findById(clothingId).select("_id");
          if (exists) {
            await markEnrichmentFailed(
              clothingId,
              "Style analysis unavailable",
            );
          }
        } catch (persistError) {
          logError("styling.enrichment.persist_failed", {
            workflow: WORKFLOW,
            clothingId: String(clothingId),
            errorMessage: persistError?.message,
          });
        }
      });
  });
};

/**
 * Authenticated retry for failed or stale processing jobs.
 */
export const retryStyleEnrichmentForUser = async ({
  auth0Id,
  clothingId,
}) => {
  const user = await User.findOne({ auth0Id });
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const clothing = await Clothes.findById(clothingId);
  if (!clothing || String(clothing.userId) !== String(user._id)) {
    throw { status: 404, message: "Clothing item not found" };
  }

  const meta = ensureStylingMetadata(clothing);
  const now = new Date();
  const stale = isEnrichmentStale(meta, now);

  if (meta.enrichmentStatus === "completed") {
    throw {
      status: 409,
      message: "Style enrichment already completed",
      code: "ALREADY_COMPLETED",
    };
  }

  if (meta.enrichmentStatus === "processing" && !stale) {
    throw {
      status: 409,
      message: "Style enrichment is already in progress",
      code: "IN_PROGRESS",
    };
  }

  const retryable =
    meta.enrichmentStatus === "pending" ||
    meta.enrichmentStatus === "failed" ||
    (meta.enrichmentStatus === "processing" && stale);

  if (!retryable) {
    throw {
      status: 409,
      message: "Style enrichment can only be retried when pending, failed, or stale",
      code: "NOT_RETRYABLE",
    };
  }

  const attemptCount = Number(meta.enrichmentAttemptCount || 0);
  if (attemptCount >= ENRICHMENT_MAX_RETRIES) {
    throw {
      status: 429,
      message: "Too many style enrichment retries for this item",
      code: "RETRY_LIMIT",
    };
  }

  if (meta.lastRetryAt) {
    const elapsed = now.getTime() - new Date(meta.lastRetryAt).getTime();
    if (elapsed < ENRICHMENT_RETRY_COOLDOWN_MS) {
      throw {
        status: 429,
        message: "Please wait before retrying style enrichment",
        code: "RETRY_COOLDOWN",
        retryAfterMs: ENRICHMENT_RETRY_COOLDOWN_MS - elapsed,
      };
    }
  }

  meta.lastRetryAt = now;
  clothing.markModified("stylingMetadata");
  await clothing.save();

  scheduleStylingEnrichment(clothing._id);

  return {
    clothingId: String(clothing._id),
    enrichmentStatus: meta.enrichmentStatus,
    message: "Style enrichment retry scheduled",
  };
};
