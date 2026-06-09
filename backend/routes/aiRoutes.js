import express from "express";
import {
  analyzeClothing,
  warmupAiClothing,
} from "../controllers/aiController.js";

const router = express.Router();

router.get("/warmup", warmupAiClothing);
router.post("/analyze-clothing", analyzeClothing);

export default router;
