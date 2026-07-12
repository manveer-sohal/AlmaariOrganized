import connectMongoDB from "../libs/mongodb.js";
import { StylistFeedback } from "../models/StylistFeedback.js";
import {
  generateRecommendationsForUser,
  verifyOwnedItemIds,
} from "../services/aiStylist.service.js";
import { validateFeedbackRequest } from "../utils/aiStylistValidation.js";

export const getRecommendations = async (req, res) => {
  try {
    const auth0Id = req.auth?.sub;
    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await generateRecommendationsForUser({
      auth0Id,
      requestBody: req.body,
    });

    return res.status(200).json({
      success: true,
      recommendations: result.recommendations,
      creditsDeducted: result.creditsDeducted,
      creditBalance: result.creditBalance,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to generate recommendations",
      code: error.code,
      creditBalance: error.creditBalance,
    });
  }
};

export const submitStylistFeedback = async (req, res) => {
  try {
    const auth0Id = req.auth?.sub;
    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const parsed = validateFeedbackRequest(req.body);
    if (parsed.error) {
      return res.status(400).json({ success: false, message: parsed.error });
    }

    const owned = await verifyOwnedItemIds(auth0Id, parsed.outfitItemIds);
    if (!owned) {
      return res.status(400).json({
        success: false,
        message: "Feedback contains invalid wardrobe item IDs",
      });
    }

    await connectMongoDB();
    await StylistFeedback.create({
      auth0Id,
      recommendationId: parsed.recommendationId,
      outfitItemIds: parsed.outfitItemIds,
      outfitSignature: parsed.outfitSignature,
      label: parsed.label,
      rating: parsed.rating,
      reasons: parsed.reasons,
      occasion: parsed.occasion,
      style: parsed.style,
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save stylist feedback",
    });
  }
};

// Legacy deterministic commentary endpoint (kept for compatibility).
export { generateAiThoughts } from "./aiStylistController.legacy.js";
