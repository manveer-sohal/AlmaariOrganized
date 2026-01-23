import express from "express";
import { generateAiThoughts } from "../controllers/aiStylistController.js";

const router = express.Router();

// Define routes
router.post("/generateAiThoughts", generateAiThoughts);
export default router;
