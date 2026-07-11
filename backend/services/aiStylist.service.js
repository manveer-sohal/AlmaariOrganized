import crypto from "crypto";
import axios from "axios";
import connectMongoDB from "../libs/mongodb.js";
import { Clothes, User } from "../models/Users.js";
import {
  buildExplanation,
  canFormOutfits,
  filterWardrobe,
  generateCandidateOutfits,
  groupBySlot,
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

const LABELS = ["Safe Choice", "Styled Choice", "Alternative"];
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_STYLIST_MODEL || "gpt-4o-mini";

const loadUserWardrobe = async (auth0Id) => {
  await connectMongoDB();
  const user = await User.findOne({ auth0Id }).populate("clothes");
  if (!user) {
    throw { status: 404, message: "User not found" };
  }
  return user.clothes || [];
};

const buildDeterministicRecommendations = (scoredCandidates, preferences) => {
  const diverse = pickDiverseOutfits(scoredCandidates, 3);
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

const rerankWithOpenAI = async (candidates, preferences, allowedIds) => {
  if (!OPENAI_API_KEY || candidates.length === 0) return null;

  const compactCandidates = candidates.slice(0, 12).map((candidate, index) => ({
    candidateId: `c${index}`,
    itemIds: candidate.items.map((item) => item._id.toString()),
    score: Number(candidate.score.toFixed(3)),
    summary: candidate.items
      .map((item) => `${item.type} (${item.slot}, ${item.colour?.join("/")})`)
      .join("; "),
  }));

  const prompt = `You are a wardrobe stylist. Pick exactly 3 distinct outfit recommendations using ONLY the candidate itemIds provided.
Occasion: ${preferences.occasion}
Weather: ${preferences.weather}
Style: ${preferences.style}
Avoid: ${preferences.avoid || "none"}
${preferences.anchorItemId ? `Anchor item (required in every outfit): ${preferences.anchorItemId}` : ""}

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
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: OPENAI_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Return only valid JSON. Never invent clothing item IDs outside the provided candidates.",
          },
          { role: "user", content: prompt },
        ],
      },
      {
        timeout: 20000,
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    const validated = validateRecommendations({
      recommendations: parsed.recommendations || [],
      allowedIds,
      anchorItemId: preferences.anchorItemId,
    });
    if (validated.length < 3) return null;

    return validated.map((rec) => ({
      ...rec,
      id: crypto.randomUUID(),
    }));
  } catch (error) {
    console.error("[ai-stylist] OpenAI rerank failed:", error.message);
    return null;
  }
};

export const generateRecommendationsForUser = async ({
  auth0Id,
  requestBody,
}) => {
  const parsed = validateRecommendationRequest(requestBody || {});
  if (parsed.errors.length > 0) {
    throw { status: 400, message: parsed.errors.join(", ") };
  }

  const wardrobe = await loadUserWardrobe(auth0Id);
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

  const filtered = filterWardrobe(wardrobe, { ...preferences, anchorItem });
  const bySlot = groupBySlot(filtered);

  if (!canFormOutfits(bySlot)) {
    throw {
      status: 400,
      code: "INSUFFICIENT_WARDROBE",
      message:
        "Add at least a top, bottom, and shoes (or a dress and shoes) to generate outfits.",
    };
  }

  const combinations = generateCandidateOutfits(bySlot, anchorItem);
  if (combinations.length === 0) {
    throw {
      status: 400,
      code: "NO_VALID_COMBINATIONS",
      message: "No valid outfit combinations found with the current filters.",
    };
  }

  const scoredCandidates = combinations
    .map((items) => ({
      items,
      score: scoreOutfit(items, preferences),
      signature: outfitSignature(items),
    }))
    .sort((a, b) => b.score - a.score);

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

  try {
    const aiRecommendations = await rerankWithOpenAI(
      scoredCandidates,
      preferences,
      allowedIds,
    );

    const recommendations =
      aiRecommendations ||
      buildDeterministicRecommendations(scoredCandidates, preferences);

    const validated = validateRecommendations({
      recommendations,
      allowedIds,
      anchorItemId: preferences.anchorItemId,
    });

    if (validated.length < 3) {
      const fallback = buildDeterministicRecommendations(
        scoredCandidates,
        preferences,
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
      return {
        recommendations: fallbackValidated,
        creditsDeducted: deduction.creditsDeducted,
        creditBalance: deduction.creditBalance,
      };
    }

    return {
      recommendations: validated,
      creditsDeducted: deduction.creditsDeducted,
      creditBalance: deduction.creditBalance,
    };
  } catch (error) {
    try {
      await refundCredits(auth0Id, 1);
    } catch (refundError) {
      console.error("[ai-stylist] failed to refund credit:", refundError);
    }

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
