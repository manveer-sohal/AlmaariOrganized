import express from "express";
import {
  analyzeClothing,
  warmupAiClothing,
} from "../controllers/aiController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  aiAnalyzeRateLimiter,
  aiRateLimiter,
} from "../middleware/rateLimiters.js";

const router = express.Router();

router.use(aiRateLimiter);

router.get("/warmup", requireAuth, warmupAiClothing);
router.post(
  "/analyze-clothing",
  aiAnalyzeRateLimiter,
  requireAuth,
  analyzeClothing,
);

export default router;
