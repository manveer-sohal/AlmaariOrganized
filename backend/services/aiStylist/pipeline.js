import crypto from "crypto";
import connectMongoDB from "../../libs/mongodb.js";
import { User } from "../../models/Users.js";
import {
  buildExplanation,
  canFormOutfits,
  filterWardrobe,
  groupBySlot,
  isDress,
  outfitSignature,
  pickDiverseOutfits,
  scoreOutfitComponents,
} from "../../utils/aiStylistScoring.js";
import { validateRecommendationRequest } from "../../utils/aiStylistValidation.js";
import {
  deductOneCredit,
  getCreditBalance,
  refundCredits,
} from "../credit.service.js";
import { getUserStyleProfile } from "../stylistPreference.service.js";
import { logError, logInfo, hashUserId } from "../../observability/logger.js";
import { updateRequestContext } from "../../observability/requestContext.js";
import { createTimer, measureAsync } from "../../observability/timer.js";
import { classifyAiError } from "../../observability/errors.js";
import { incMetric, observeMs } from "../../observability/metrics.js";
import {
  resolveStylistMode,
  validateModeRequirements,
} from "./modeResolver.js";
import { buildConstraints } from "./constraints.js";
import { generateConstrainedCandidates } from "./candidateGenerator.js";
import { validateOutfitRecommendations } from "./validator.js";
import { rerankCandidates } from "./reranker.js";
import { sanitizeRecommendationLayering } from "./layering/layeringValidator.js";

const LABELS = ["Safe Choice", "Styled Choice", "Alternative"];
const WORKFLOW = "outfit_recommendation";

const loadUserWardrobe = async (auth0Id) => {
  await connectMongoDB();
  const user = await User.findOne({ auth0Id }).populate("clothes");
  if (!user) {
    throw { status: 404, message: "User not found" };
  }
  return user.clothes || [];
};

const buildDeterministicRecommendations = (
  scoredCandidates,
  preferences,
  excludedSignatures = [],
) => {
  // Prefer diversity of layer structures across the 3 labels
  const byLayerDepth = (candidate) => {
    const L = candidate.layering || {};
    return [L.baseTopId, L.midLayerId, L.outerLayerId, L.neckwearId].filter(
      Boolean,
    ).length;
  };

  const sorted = [...scoredCandidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return byLayerDepth(b) - byLayerDepth(a);
  });

  const diverse = pickDiverseOutfits(sorted, 3, excludedSignatures);

  // Reorder so Safe=simple, Styled=more layered, Alternative=other when possible
  const withDepth = diverse.map((c) => ({ c, depth: byLayerDepth(c) }));
  withDepth.sort((a, b) => a.depth - b.depth);
  const ordered =
    withDepth.length === 3
      ? [withDepth[0].c, withDepth[2].c, withDepth[1].c]
      : diverse;

  return ordered.map((candidate, index) => {
    const label = LABELS[index] || "Alternative";
    return {
      id: crypto.randomUUID(),
      label,
      name:
        index === 0
          ? `${preferences.occasion} Essentials`
          : index === 1
            ? `${preferences.style} Edit`
            : `${preferences.occasion} Alternative`,
      itemIds: candidate.items.map((item) => item._id.toString()),
      explanation: buildExplanation(
        candidate.items,
        label,
        preferences,
        candidate.layering,
      ),
      confidence: Number(Math.min(0.98, candidate.score).toFixed(2)),
      layering: candidate.layering || undefined,
    };
  });
};

export const runStylistPipeline = async ({ auth0Id, requestBody }) => {
  updateRequestContext({ workflow: WORKFLOW });
  const timer = createTimer();
  const generationId = crypto.randomUUID();
  incMetric("ai.requests.total");
  incMetric("ai.workflow.outfit_recommendation.total");

  logInfo("stylist.request", {
    workflow: WORKFLOW,
    generationId,
    userIdHash: hashUserId(auth0Id),
  });

  const parseTimed = await measureAsync(async () =>
    validateRecommendationRequest(requestBody || {}),
  );
  const parsed = parseTimed.result;
  if (parsed.errors.length > 0) {
    throw { status: 400, message: parsed.errors.join(", ") };
  }

  const resolved = resolveStylistMode(parsed);
  logInfo("stylist.mode_resolved", {
    workflow: WORKFLOW,
    generationId,
    mode: resolved.mode,
    requiredItemCount: resolved.requiredItemIds.length,
    parentGenerationId: resolved.parentGenerationId,
  });

  const modeError = validateModeRequirements(resolved);
  if (modeError) {
    throw { status: 400, code: modeError.code, message: modeError.message };
  }

  const wardrobeTimed = await measureAsync(() => loadUserWardrobe(auth0Id));
  if (!wardrobeTimed.ok) throw wardrobeTimed.error;
  const wardrobe = wardrobeTimed.result;

  if (wardrobe.length === 0) {
    throw {
      status: 400,
      code: "EMPTY_WARDROBE",
      message: "Add clothes to your wardrobe before generating an outfit.",
    };
  }

  const wardrobeById = new Map(
    wardrobe.map((item) => [item._id.toString(), item]),
  );

  const requiredItems = [];
  for (const id of resolved.requiredItemIds) {
    const item = wardrobeById.get(id);
    if (!item) {
      throw {
        status: 400,
        message: `Required item ${id} was not found in your wardrobe`,
      };
    }
    requiredItems.push(item);
  }

  const preferences = {
    occasion: parsed.occasion,
    weather: parsed.weather,
    style: parsed.style,
    avoid: parsed.avoid,
    refinementPrompt: resolved.refinementPrompt,
    anchorItemId: resolved.requiredItemIds[0] || null,
  };

  const constraints = buildConstraints({
    mode: resolved.mode,
    requiredItemIds: resolved.requiredItemIds,
    requiredItems,
    preferences,
  });
  constraints.generationId = generationId;

  if (constraints.conflicts.length > 0) {
    throw { status: 400, message: constraints.conflicts[0] };
  }

  logInfo("stylist.constraints_built", {
    workflow: WORKFLOW,
    generationId,
    mode: resolved.mode,
    requiredItemCount: resolved.requiredItemIds.length,
    missingSlots: [...constraints.missingSlots],
    dressPath: constraints.dressPath,
  });

  if (resolved.requiredItemIds.length > 0) {
    logInfo("stylist.anchor.constraints_applied", {
      workflow: WORKFLOW,
      generationId,
      parentGenerationId: resolved.parentGenerationId,
      requiredItemCount: resolved.requiredItemIds.length,
      anchoredItemIds: resolved.requiredItemIds,
      mode: resolved.mode,
    });
  }

  const profile = await getUserStyleProfile(auth0Id, preferences);
  const excludedSignatures = [
    ...(profile.recentNegativeSignatures || []),
    ...resolved.priorOutfitSignatures,
  ];

  const filtered = filterWardrobe(wardrobe, {
    ...preferences,
    requiredItems,
    anchorItem: requiredItems[0] || null,
  });
  const bySlot = groupBySlot(filtered);

  // Ensure required items remain in slot groups even if avoid-filtered elsewhere
  for (const item of requiredItems) {
    const slot = String(item.slot || "")
      .trim()
      .toLowerCase();
    if (!bySlot[slot]) continue;
    if (!bySlot[slot].some((i) => i._id.toString() === item._id.toString())) {
      bySlot[slot].unshift(item);
    }
  }

  if (!canFormOutfits(bySlot) && resolved.requiredItemIds.length === 0) {
    throw {
      status: 400,
      code: "INSUFFICIENT_WARDROBE",
      message:
        "Add at least a top, bottom, and shoes (or a dress and shoes) to generate outfits.",
    };
  }

  const candidateTimed = await measureAsync(async () => {
    try {
      return generateConstrainedCandidates(bySlot, constraints);
    } catch (error) {
      if (error.code === "LAYERING_CONFLICT") {
        throw {
          status: 400,
          code: "LAYERING_CONFLICT",
          message: error.message,
        };
      }
      throw error;
    }
  });
  if (!candidateTimed.ok) {
    throw candidateTimed.error;
  }
  const combinations = candidateTimed.result;

  logInfo("stylist.candidates_generated", {
    workflow: WORKFLOW,
    generationId,
    mode: resolved.mode,
    candidateCount: combinations.length,
    wardrobeItemCount: wardrobe.length,
    requiredItemCount: resolved.requiredItemIds.length,
    durationMs: candidateTimed.durationMs,
  });

  if (combinations.length === 0) {
    throw {
      status: 400,
      code: "NO_VALID_COMBINATIONS",
      message: "No valid outfit combinations found with the current filters.",
    };
  }

  const scoringTimed = await measureAsync(async () => {
    const normalize = (combo) => {
      const items = Array.isArray(combo) ? combo : combo.items;
      const layering = Array.isArray(combo) ? undefined : combo.layering;
      const layeringScore = Array.isArray(combo)
        ? undefined
        : combo.layeringScore;
      const { total, components } = scoreOutfitComponents(
        items,
        preferences,
        profile,
        {
          priorSignatures: resolved.priorOutfitSignatures,
          layeringScore,
        },
      );
      return {
        items,
        layering,
        score: total,
        components,
        signature: outfitSignature(items),
      };
    };

    const scored = combinations
      .map(normalize)
      .filter((candidate) => {
        const ids = candidate.items.map((item) => item._id.toString());
        if (new Set(ids).size !== ids.length) return false;
        if (
          resolved.priorOutfitSignatures.length > 0 &&
          candidate.components.novelty === 0
        ) {
          return false;
        }
        return !excludedSignatures.includes(candidate.signature);
      })
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) return scored;
    return combinations.map(normalize).sort((a, b) => b.score - a.score);
  });

  const candidatesForRanking = scoringTimed.result;
  observeMs("ai.outfit.scoring.ms", scoringTimed.durationMs);

  logInfo("stylist.candidates_scored", {
    workflow: WORKFLOW,
    generationId,
    mode: resolved.mode,
    candidateCount: combinations.length,
    validCandidateCount: candidatesForRanking.length,
    durationMs: scoringTimed.durationMs,
    topScore: candidatesForRanking[0]?.score ?? null,
  });

  const allowedIds = new Set(wardrobe.map((item) => item._id.toString()));

  let deduction;
  try {
    deduction = await deductOneCredit(auth0Id);
  } catch (error) {
    const balance = await getCreditBalance(auth0Id).catch(() => undefined);
    throw {
      status: error.status || 402,
      message: error.message || "Insufficient credits",
      creditBalance: balance,
    };
  }

  let fallbackUsed = false;
  let rerankUsed = false;

  try {
    const aiRecommendations = await rerankCandidates({
      candidates: candidatesForRanking,
      preferences,
      allowedIds,
      requiredItemIds: resolved.requiredItemIds,
      mode: resolved.mode,
      preferenceSummary: profile.summary,
      refinementPrompt: resolved.refinementPrompt,
      generationId,
    });
    rerankUsed = Boolean(aiRecommendations);

    const recommendations =
      aiRecommendations ||
      buildDeterministicRecommendations(
        candidatesForRanking,
        preferences,
        excludedSignatures,
      );

    if (!aiRecommendations) fallbackUsed = true;

    let validated = validateOutfitRecommendations({
      recommendations,
      allowedIds,
      requiredItemIds: resolved.requiredItemIds,
      generationId,
      mode: resolved.mode,
      wardrobeById,
    });

    if (validated.length < 3) {
      fallbackUsed = true;
      const fallback = buildDeterministicRecommendations(
        candidatesForRanking,
        preferences,
        excludedSignatures,
      );
      validated = validateOutfitRecommendations({
        recommendations: fallback,
        allowedIds,
        requiredItemIds: resolved.requiredItemIds,
        generationId,
        mode: resolved.mode,
        wardrobeById,
      });
      if (validated.length < 3) {
        throw {
          status: 400,
          message: "Unable to generate three distinct outfit recommendations.",
        };
      }
    }

    // Attach deterministic layering metadata from scored candidates
    const layeringBySignature = new Map();
    for (const candidate of candidatesForRanking) {
      const sig = outfitSignature(candidate.items);
      if (candidate.layering && !layeringBySignature.has(sig)) {
        layeringBySignature.set(sig, candidate.layering);
      }
    }
    validated = validated.map((rec) => {
      const layering =
        rec.layering ||
        layeringBySignature.get([...rec.itemIds].sort().join("|")) ||
        undefined;
      if (!layering) return { ...rec, layering: undefined };
      return sanitizeRecommendationLayering({
        recommendation: { ...rec, layering },
        itemsById: wardrobeById,
        generationId,
      });
    });

    const totalMs = timer.elapsedMs();
    observeMs("ai.outfit_recommendation.ms", totalMs);
    incMetric("ai.requests.success");
    incMetric("ai.workflow.outfit_recommendation.success");

    logInfo("stylist.completed", {
      workflow: WORKFLOW,
      generationId,
      parentGenerationId: resolved.parentGenerationId,
      mode: resolved.mode,
      wardrobeItemCount: wardrobe.length,
      requiredItemCount: resolved.requiredItemIds.length,
      candidateCount: combinations.length,
      validCandidateCount: candidatesForRanking.length,
      rerankUsed,
      fallbackUsed,
      durationMs: totalMs,
      dressPathHint: Boolean(bySlot.body?.some(isDress)),
    });

    return {
      generationId,
      mode: resolved.mode,
      requiredItemIds: resolved.requiredItemIds,
      parentGenerationId: resolved.parentGenerationId,
      recommendations: validated,
      creditsDeducted: deduction.creditsDeducted,
      creditBalance: deduction.creditBalance,
    };
  } catch (error) {
    try {
      await refundCredits(auth0Id, 1);
      incMetric("ai.credit.refunds");
    } catch (refundError) {
      logError("ai.credit.refund.failed", {
        workflow: WORKFLOW,
        errorMessage: refundError?.message,
      });
    }

    const classified = classifyAiError(error);
    logError("ai.outfit.workflow.failed", {
      workflow: WORKFLOW,
      generationId,
      mode: resolved.mode,
      durationMs: timer.elapsedMs(),
      classification: classified.classification,
      errorMessage: error.message,
      code: error.code,
    });

    const balance = await getCreditBalance(auth0Id).catch(
      () => deduction?.creditBalance,
    );

    throw {
      status: error.status || 500,
      message: error.message || "Failed to generate outfit recommendations",
      code: error.code,
      creditBalance: balance,
    };
  }
};
