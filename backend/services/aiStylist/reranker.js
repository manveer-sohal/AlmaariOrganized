import crypto from "crypto";
import { instrumentedOpenAiChat } from "../../observability/openaiInstrumented.js";
import { logError, logInfo } from "../../observability/logger.js";
import { observeMs } from "../../observability/metrics.js";
import { classifyAiError } from "../../observability/errors.js";
import { serializeWardrobeItemForStylist } from "../../utils/serializeWardrobeItem.js";
import { validateOutfitRecommendations } from "./validator.js";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_STYLIST_MODEL || "gpt-4o-mini";

/**
 * Optional LLM rerank over deterministic candidates only.
 * Never invents wardrobe IDs; returns null on failure.
 */
export const rerankCandidates = async ({
  candidates,
  preferences,
  allowedIds,
  requiredItemIds = [],
  mode = "random",
  preferenceSummary = "",
  refinementPrompt = "",
  generationId = null,
}) => {
  if (!OPENAI_API_KEY || candidates.length === 0) return null;

  logInfo("stylist.rerank_started", {
    workflow: "outfit_recommendation",
    generationId,
    mode,
    candidateCount: Math.min(12, candidates.length),
  });

  const compactCandidates = candidates.slice(0, 12).map((candidate, index) => ({
    candidateId: `c${index}`,
    itemIds: candidate.items.map((item) => item._id.toString()),
    score: Number(candidate.score.toFixed(3)),
    components: candidate.components || undefined,
    layering: candidate.layering || undefined,
    items: candidate.items.map(serializeWardrobeItemForStylist),
  }));

  const prompt = `You are a wardrobe stylist. Pick exactly 3 distinct outfit recommendations using ONLY the candidate itemIds provided.

Rules:
1. Build complete outfits with valid slot coverage.
2. Every required item ID must appear in every outfit.
3. Prefer items with compatible styleCategory values.
4. Prefer user-sourced styleCategory and occasionTags over AI formalityScore, statementLevel, and outfitRole when sources conflict.
5. Keep formalityScore reasonably consistent across the outfit.
6. Use occasionTags to match the requested use case.
7. Avoid combining too many high-statement items.
8. Prefer one Statement outfitRole item at most unless a bold look was requested.
9. Use Base and Layer pieces to support Accent or Statement pieces.
10. Respect colour compatibility.
11. Respect fit and silhouette compatibility using available fit data.
12. Respect season when present.
13. Never fabricate clothing items that are not present in the candidate list.
14. Return item IDs exactly as provided in candidates — copy a full candidate itemIds list.
15. Avoid duplicate items within the same outfit.
16. Produce three meaningfully different outfit options when enough inventory exists (vary layer depth when candidates allow).
17. Honor the free-text refinement when present without dropping required items.
18. Gracefully degrade when richer styling metadata is missing.
19. Do not invent layering relationships, wear states, or neckwear pairings outside the candidate pool.
20. Never place a tie without a collared shirt already in that candidate.
21. Prefer Safe Choice = simpler layering, Styled Choice = intentional layers, Alternative = a different structure when available.
22. Do not describe a garment as worn open unless its metadata identifies it as a button-up, overshirt, flannel, cardigan, zip layer, or another explicitly openable garment.
23. A generic item labeled only as "Shirt" is not automatically openable.
24. Never describe T-shirts, polos, sweaters, pullovers, or non-button shirts as worn open.
25. Belts are waist accessories for compatible bottoms — never treat them as tops or neckwear.
26. All anchored/required items must appear in every selected outfit — never remove them.
27. A jacket, blazer, coat, sweater, cardigan, or hoodie must include a compatible base shirt underneath.
28. Do not treat broad clothing categories as mutually exclusive when their normalized layer roles differ (e.g. shirt + jacket is valid).
29. Never return a jacket-only or sweater-only upper body.

Mode: ${mode}
Occasion: ${preferences.occasion}
Weather: ${preferences.weather}
Style: ${preferences.style}
Avoid: ${preferences.avoid || "none"}
Required item IDs (hard constraints — must appear in every outfit): ${
    requiredItemIds.length ? requiredItemIds.join(", ") : "none"
  }
${refinementPrompt ? `Refinement request: ${refinementPrompt}` : ""}
${
  preferenceSummary
    ? `Learned preferences from user feedback: ${preferenceSummary}`
    : ""
}

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
            "Return only valid JSON. Never invent clothing item IDs outside the provided candidates. Never remove required item IDs. Prefer candidates that align with learned user preferences and refinement text when provided. Never describe a generic Shirt, T-shirt, polo, sweater, or pullover as worn open — only explicitly openable garments (button-up, overshirt, flannel, cardigan, zip layer) may be open.",
        },
        { role: "user", content: prompt },
      ],
    });

    observeMs("ai.outfit_reranking.ms", durationMs);

    if (!content) {
      logInfo("stylist.rerank_completed", {
        workflow: "outfit_recommendation",
        generationId,
        mode,
        success: false,
        reason: "empty_content",
      });
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      logInfo("stylist.rerank_completed", {
        workflow: "outfit_recommendation",
        generationId,
        mode,
        success: false,
        reason: "invalid_json",
      });
      return null;
    }

    const validated = validateOutfitRecommendations({
      recommendations: parsed.recommendations || [],
      allowedIds,
      requiredItemIds,
      generationId,
      mode,
    });

    if (validated.length < 3) {
      logInfo("stylist.rerank_completed", {
        workflow: "outfit_recommendation",
        generationId,
        mode,
        success: false,
        reason: "insufficient_valid_recommendations",
        validatedCount: validated.length,
      });
      return null;
    }

    logInfo("stylist.rerank_completed", {
      workflow: "outfit_recommendation",
      generationId,
      mode,
      success: true,
      durationMs,
    });

    const layeringBySignature = new Map();
    for (const candidate of candidates.slice(0, 12)) {
      const sig = candidate.items
        .map((item) => item._id.toString())
        .sort()
        .join("|");
      if (candidate.layering && !layeringBySignature.has(sig)) {
        layeringBySignature.set(sig, candidate.layering);
      }
    }

    return validated.map((rec) => ({
      ...rec,
      id: crypto.randomUUID(),
      layering:
        rec.layering ||
        layeringBySignature.get([...rec.itemIds].sort().join("|")) ||
        undefined,
    }));
  } catch (error) {
    logError("ai.inference.failed", {
      workflow: "outfit_reranking",
      errorMessage: error.message,
      classification: classifyAiError(error).classification,
    });
    logInfo("stylist.rerank_completed", {
      workflow: "outfit_recommendation",
      generationId,
      mode,
      success: false,
      reason: "exception",
    });
    return null;
  }
};
