import express from "express";
import {
  analyzeClothing,
  warmupAiClothing,
} from "../controllers/aiController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// No user data — optional pre-warm; left unauthenticated.
router.get("/warmup", warmupAiClothing);
router.post("/analyze-clothing", requireAuth, analyzeClothing);

export default router;
