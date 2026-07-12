import crypto from "crypto";
import connectMongoDB from "../libs/mongodb.js";
import { Clothes, User } from "../models/Users.js";
import {
  buildExplanation,
  canFormOutfits,
  filterWardrobe,
  generateCandidateOutfits,
  groupBySlot,
  isDress,
  outfitSignature,
  pickDiverseOutfits,
  scoreOutfit,
} from "../utils/aiStylistScoring.js";
import {
  validateRecommendationRequest,
  validateRecommendations,
} from "../utils/aiStylistValidation.js";
import {
  deductOneCredit,
  getCreditBalance,
  refundCredits,
} from "./credit.service.js";
import { getUserStyleProfile } from "./stylistPreference.service.js";
import { instrumentedOpenAiChat } from "../observability/openaiInstrumented.js";
import { logError, logInfo, hashUserId } from "../observability/logger.js";
import { updateRequestContext } from "../observability/requestContext.js";
import { createTimer, measureAsync } from "../observability/timer.js";
import { classifyAiError } from "../observability/errors.js";
import { incMetric, observeMs } from "../observability/metrics.js";
import { serializeWardrobeItemForStylist } from "../utils/serializeWardrobeItem.js";

const LABELS = ["Safe Choice", "Styled Choice", "Alternative"];
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_STYLIST_MODEL || "gpt-4o-mini";
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
  const diverse = pickDiverseOutfits(
    scoredCandidates,
    3,
    excludedSignatures,
  );
  return diverse.map((candidate, index) => {
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
      explanation: buildExplanation(candidate.items, label, preferences),
      confidence: Number(Math.min(0.98, candidate.score).toFixed(2)),
    };
  });
};

const rerankWithOpenAI = async (
  candidates,
  preferences,
  allowedIds,
  preferenceSummary = "",
) => {
  if (!OPENAI_API_KEY || candidates.length === 0) return null;

  const compactCandidates = candidates.slice(0, 12).map((candidate, index) => ({
    candidateId: `c${index}`,
    itemIds: candidate.items.map((item) => item._id.toString()),
    score: Number(candidate.score.toFixed(3)),
    items: candidate.items.map(serializeWardrobeItemForStylist),
  }));

  // Temporary diagnostics: confirm legacy items serialize without rich fields.
  logInfo("ai.outfit.pipeline.llm_payload", {
    workflow: WORKFLOW,
    stage: "before_llm",
    candidateCount: compactCandidates.length,
    serializedSample: compactCandidates.slice(0, 2),
    missingStyleCategoryCount: compactCandidates.reduce(
      (count, candidate) =>
        count +
        candidate.items.filter((item) => item && !item.styleCategory).length,
      0,
    ),
  });

  const prompt = `You are a wardrobe stylist. Pick exactly 3 distinct outfit recommendations using ONLY the candidate itemIds provided.

Rules:
1. Build complete outfits with valid slot coverage.
2. Respect the selected anchor item when provided.
3. Prefer items with compatible styleCategory values.
4. Prefer user-sourced styleCategory and occasionTags over AI formalityScore, statementLevel, and outfitRole when sources conflict.
5. Keep formalityScore reasonably consistent across the outfit (use provided formalityScore values as already aligned).
6. Use occasionTags to match the requested use case.
7. Avoid combining too many high-statement items.
8. Prefer one Statement outfitRole item at most unless a bold look was requested.
9. Use Base and Layer pieces to support Accent or Statement pieces.
10. Respect colour compatibility.
11. Respect fit and silhouette compatibility using available fit data.
12. Respect season when present.
13. Never fabricate clothing items that are not present in the wardrobe.
14. Return item IDs exactly as provided.
15. Avoid duplicate items within the same outfit.
16. Produce three meaningfully different outfit options when enough inventory exists.
17. Gracefully degrade when richer styling metadata is missing — legacy wardrobe items without styleCategory, occasionTags, formalityScore, statementLevel, or outfitRole remain fully valid.

Occasion: ${preferences.occasion}
Weather: ${preferences.weather}
Style: ${preferences.style}
Avoid: ${preferences.avoid || "none"}
${preferences.anchorItemId ? `Anchor item (required in every outfit): ${preferences.anchorItemId}` : ""}
${preferenceSummary ? `Learned preferences from user feedback: ${preferenceSummary}` : ""}

Candidates:
${JSON.stringify(compactCandidates, null, 2)}

Return strict JSON:
{
  "recommendations": [
    {
      "label": "Safe Choice" | "Styled Choice" | "Alternative",
      "name": "short title",
      "itemIds": ["..."],
      "explanation": "one or two sentences",
      "confidence": 0.0-1.0
    }
  ]
}`;

  try {
    const { content, durationMs } = await instrumentedOpenAiChat({
      apiKey: OPENAI_API_KEY,
      model: OPENAI_MODEL,
      temperature: 0.4,
      responseFormat: { type: "json_object" },
      workflow: "outfit_reranking",
      messages: [
        {
          role: "system",
          content:
            "Return only valid JSON. Never invent clothing item IDs outside the provided candidates. Prefer candidates that align with learned user preferences when provided. Prefer outfits with compatible styleCategory, formalityScore, and occasionTags when those fields are present. Missing styling metadata is allowed — never reject an item only because styleCategory, occasionTags, formalityScore, statementLevel, or outfitRole is absent.",
        },
        { role: "user", content: prompt },
      ],
    });

    observeMs("ai.outfit_reranking.ms", durationMs);

    if (!content) {
      logInfo("ai.response.validation.failed", {
        workflow: "outfit_reranking",
        reason: "empty_content",
      });
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      logInfo("ai.response.validation.failed", {
        workflow: "outfit_reranking",
        reason: "invalid_json",
      });
      return null;
    }

    const validated = validateRecommendations({
      recommendations: parsed.recommendations || [],
      allowedIds,
      anchorItemId: preferences.anchorItemId,
    });
    if (validated.length < 3) {
      logInfo("ai.response.validation.failed", {
        workflow: "outfit_reranking",
        reason: "insufficient_valid_recommendations",
        validatedCount: validated.length,
      });
      return null;
    }

    return validated.map((rec) => ({
      ...rec,
      id: crypto.randomUUID(),
    }));
  } catch (error) {
    logError("ai.inference.failed", {
      workflow: "outfit_reranking",
      errorMessage: error.message,
      classification: classifyAiError(error).classification,
    });
    return null;
  }
};

export const generateRecommendationsForUser = async ({
  auth0Id,
  requestBody,
}) => {
  updateRequestContext({ workflow: WORKFLOW });
  const timer = createTimer();
  incMetric("ai.requests.total");
  incMetric("ai.workflow.outfit_recommendation.total");

  logInfo("ai.request.received", {
    workflow: WORKFLOW,
    userIdHash: hashUserId(auth0Id),
  });

  const parseTimed = await measureAsync(async () =>
    validateRecommendationRequest(requestBody || {}),
  );
  const parsed = parseTimed.result;
  if (parsed.errors.length > 0) {
    logInfo("ai.validation.failed", {
      workflow: WORKFLOW,
      reason: "request_schema",
      durationMs: parseTimed.durationMs,
    });
    throw { status: 400, message: parsed.errors.join(", ") };
  }

  const wardrobeTimed = await measureAsync(() => loadUserWardrobe(auth0Id));
  if (!wardrobeTimed.ok) {
    throw wardrobeTimed.error;
  }
  const wardrobe = wardrobeTimed.result;
  logInfo("ai.wardrobe.retrieved", {
    workflow: WORKFLOW,
    wardrobeItemCount: wardrobe.length,
    durationMs: wardrobeTimed.durationMs,
  });

  if (wardrobe.length === 0) {
    throw {
      status: 400,
      code: "EMPTY_WARDROBE",
      message: "Add clothing to your wardrobe before generating outfits.",
    };
  }

  let anchorItem = null;
  if (parsed.anchorItemId) {
    anchorItem = wardrobe.find(
      (item) => item._id.toString() === String(parsed.anchorItemId),
    );
    if (!anchorItem) {
      logInfo("ai.validation.failed", {
        workflow: WORKFLOW,
        reason: "anchor_not_found",
      });
      throw { status: 400, message: "Anchor item not found in your wardrobe" };
    }
  }

  const preferences = {
    occasion: parsed.occasion,
    weather: parsed.weather,
    style: parsed.style,
    avoid: parsed.avoid,
    anchorItemId: anchorItem?._id?.toString() || null,
  };

  const profile = await getUserStyleProfile(auth0Id, preferences);
  const excludedSignatures = profile.recentNegativeSignatures || [];

  const filtered = filterWardrobe(wardrobe, { ...preferences, anchorItem });
  const bySlot = groupBySlot(filtered);

  const legacyCount = filtered.filter((item) => !item.stylingMetadata).length;
  const enrichedCount = filtered.filter((item) =>
    Boolean(item.stylingMetadata?.styleCategory || item.stylingMetadata?.formalityScore),
  ).length;

  logInfo("ai.outfit.pipeline.stage", {
    workflow: WORKFLOW,
    stage: "after_filter",
    wardrobeCount: wardrobe.length,
    filteredCount: filtered.length,
    legacyCount,
    enrichedCount,
    slotCounts: {
      head: bySlot.head.length,
      body: bySlot.body.length,
      legs: bySlot.legs.length,
      feet: bySlot.feet.length,
    },
    hasAnchor: Boolean(anchorItem),
    anchorSlot: anchorItem?.slot || null,
    canFormOutfits: canFormOutfits(bySlot),
  });

  if (!canFormOutfits(bySlot)) {
    logInfo("ai.outfit.pipeline.empty", {
      workflow: WORKFLOW,
      firstEmptyStage: "can_form_outfits",
      slotCounts: {
        head: bySlot.head.length,
        body: bySlot.body.length,
        legs: bySlot.legs.length,
        feet: bySlot.feet.length,
      },
    });
    throw {
      status: 400,
      code: "INSUFFICIENT_WARDROBE",
      message:
        "Add at least a top, bottom, and shoes (or a dress and shoes) to generate outfits.",
    };
  }

  const candidateTimed = await measureAsync(async () => {
    const combinations = generateCandidateOutfits(bySlot, anchorItem);
    return combinations;
  });
  const combinations = candidateTimed.result;
  logInfo("ai.outfit.candidates.generated", {
    workflow: WORKFLOW,
    candidateCount: combinations.length,
    durationMs: candidateTimed.durationMs,
  });
  logInfo("ai.outfit.pipeline.stage", {
    workflow: WORKFLOW,
    stage: "after_generate_candidates",
    candidateCount: combinations.length,
  });

  if (combinations.length === 0) {
    logInfo("ai.outfit.pipeline.empty", {
      workflow: WORKFLOW,
      firstEmptyStage: "generate_candidate_outfits",
      slotCounts: {
        head: bySlot.head.length,
        body: bySlot.body.length,
        legs: bySlot.legs.length,
        feet: bySlot.feet.length,
      },
      hasAnchor: Boolean(anchorItem),
      bodyDressCount: bySlot.body.filter(isDress).length,
    });
    throw {
      status: 400,
      code: "NO_VALID_COMBINATIONS",
      message: "No valid outfit combinations found with the current filters.",
    };
  }

  const scoringTimed = await measureAsync(async () => {
    const scoredCandidates = combinations
      .map((items) => ({
        items,
        score: scoreOutfit(items, preferences, profile),
        signature: outfitSignature(items),
      }))
      .filter((candidate) => !excludedSignatures.includes(candidate.signature))
      .sort((a, b) => b.score - a.score);

    return scoredCandidates.length > 0
      ? scoredCandidates
      : combinations
          .map((items) => ({
            items,
            score: scoreOutfit(items, preferences, profile),
            signature: outfitSignature(items),
          }))
          .sort((a, b) => b.score - a.score);
  });
  const candidatesForRanking = scoringTimed.result;
  observeMs("ai.outfit.scoring.ms", scoringTimed.durationMs);
  logInfo("ai.outfit.scoring.completed", {
    workflow: WORKFLOW,
    scoredCount: candidatesForRanking.length,
    durationMs: scoringTimed.durationMs,
  });
  logInfo("ai.outfit.pipeline.stage", {
    workflow: WORKFLOW,
    stage: "after_scoring",
    scoredCount: candidatesForRanking.length,
    topScore: candidatesForRanking[0]?.score ?? null,
  });

  if (candidatesForRanking.length === 0) {
    logInfo("ai.outfit.pipeline.empty", {
      workflow: WORKFLOW,
      firstEmptyStage: "scoring",
    });
  }

  const allowedIds = new Set(wardrobe.map((item) => item._id.toString()));

  let deduction;
  try {
    deduction = await deductOneCredit(auth0Id);
    logInfo("ai.credits.checked", {
      workflow: WORKFLOW,
      userIdHash: hashUserId(auth0Id),
      success: true,
    });
  } catch (error) {
    const balance = await getCreditBalance(auth0Id).catch(() => undefined);
    logInfo("ai.credits.checked", {
      workflow: WORKFLOW,
      userIdHash: hashUserId(auth0Id),
      success: false,
      classification: "insufficient_credits",
    });
    throw {
      status: error.status || 402,
      message: error.message || "Insufficient credits",
      creditBalance: balance,
    };
  }

  try {
    const aiRecommendations = await rerankWithOpenAI(
      candidatesForRanking,
      preferences,
      allowedIds,
      profile.summary,
    );

    const recommendations =
      aiRecommendations ||
      buildDeterministicRecommendations(
        candidatesForRanking,
        preferences,
        excludedSignatures,
      );

    const validated = validateRecommendations({
      recommendations,
      allowedIds,
      anchorItemId: preferences.anchorItemId,
    });

    let finalRecommendations = validated;
    if (validated.length < 3) {
      logInfo("ai.response.validation.failed", {
        workflow: WORKFLOW,
        reason: "primary_recommendations_insufficient",
        validatedCount: validated.length,
      });
      const fallback = buildDeterministicRecommendations(
        candidatesForRanking,
        preferences,
        excludedSignatures,
      );
      const fallbackValidated = validateRecommendations({
        recommendations: fallback,
        allowedIds,
        anchorItemId: preferences.anchorItemId,
      });
      if (fallbackValidated.length < 3) {
        throw {
          status: 400,
          message: "Unable to generate three distinct outfit recommendations.",
        };
      }
      finalRecommendations = fallbackValidated;
    }

    const totalMs = timer.elapsedMs();
    observeMs("ai.outfit_recommendation.ms", totalMs);
    incMetric("ai.requests.success");
    incMetric("ai.workflow.outfit_recommendation.success");
    logInfo("ai.outfit.workflow.completed", {
      workflow: WORKFLOW,
      durationMs: totalMs,
      recommendationCount: finalRecommendations.length,
      usedLlmRerank: Boolean(aiRecommendations),
      creditsDeducted: deduction.creditsDeducted,
      success: true,
    });

    return {
      recommendations: finalRecommendations,
      creditsDeducted: deduction.creditsDeducted,
      creditBalance: deduction.creditBalance,
    };
  } catch (error) {
    try {
      await refundCredits(auth0Id, 1);
      logInfo("ai.credit.refund.completed", {
        workflow: WORKFLOW,
        reason: "generation_failure",
        userIdHash: hashUserId(auth0Id),
      });
      incMetric("ai.credit.refunds");
    } catch (refundError) {
      logError("ai.credit.refund.failed", {
        workflow: WORKFLOW,
        errorMessage: refundError?.message,
      });
    }

    const classified = classifyAiError(error);
    const totalMs = timer.elapsedMs();
    observeMs("ai.outfit_recommendation.ms", totalMs);
    incMetric("ai.requests.failed");
    logError("ai.outfit.workflow.failed", {
      workflow: WORKFLOW,
      durationMs: totalMs,
      classification: classified.classification,
      retryable: classified.retryable,
      status: error.status || classified.status,
      errorMessage: error.message,
      code: error.code,
    });

    const balance = await getCreditBalance(auth0Id).catch(
      () => deduction.creditBalance,
    );

    throw {
      status: error.status || 500,
      message: error.message || "Failed to generate outfit recommendations",
      code: error.code,
      creditBalance: balance,
    };
  }
};

export const verifyOwnedItemIds = async (auth0Id, itemIds) => {
  await connectMongoDB();
  const user = await User.findOne({ auth0Id }, { _id: 1 });
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const count = await Clothes.countDocuments({
    _id: { $in: itemIds },
    userId: user._id,
  });

  return count === itemIds.length;
};
