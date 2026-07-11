import express from "express";
import {
  generateAiThoughts,
  getRecommendations,
  submitStylistFeedback,
} from "../controllers/aiStylistController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { aiStylistRateLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/generateAiThoughts", generateAiThoughts);
router.post(
  "/recommendations",
  aiStylistRateLimiter,
  requireAuth,
  getRecommendations,
);
router.post("/feedback", requireAuth, submitStylistFeedback);

export default router;
