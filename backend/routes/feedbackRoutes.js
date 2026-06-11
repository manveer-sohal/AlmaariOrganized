import express from "express";
import {
  createFeedback,
  getPaginatedFeedback,
  getFeedback,
} from "../controllers/feedbackController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

router.post("/createFeedback", requireAuth, createFeedback);
router.get("/getPaginatedFeedback", requireAdmin, getPaginatedFeedback);
router.get("/getFeedback", requireAdmin, getFeedback);

export default router;
