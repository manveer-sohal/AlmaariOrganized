import express from "express";
import {
  createFeedback,
  getPaginatedFeedback,
  getFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/createFeedback", createFeedback);
router.get("/getPaginatedFeedback", getPaginatedFeedback);
router.get("/getFeedback", getFeedback);
export default router;
