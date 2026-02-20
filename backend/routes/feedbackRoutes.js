import express from "express";
import { createFeedback } from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/createFeedback", createFeedback);

export default router;
