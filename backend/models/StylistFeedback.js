import mongoose from "mongoose";
import { STYLIST_NEGATIVE_REASONS } from "../constants/clothingMetadata.js";

const stylistFeedbackSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, index: true },
  recommendationId: { type: String, required: true },
  outfitItemIds: [{ type: String }],
  outfitSignature: { type: String, index: true },
  label: { type: String },
  rating: { type: String, enum: ["positive", "negative"], required: true },
  reasons: {
    type: [String],
    enum: STYLIST_NEGATIVE_REASONS,
    default: undefined,
  },
  occasion: { type: String },
  style: { type: String },
  generationId: { type: String },
  mode: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const StylistFeedback =
  mongoose.models.StylistFeedback ||
  mongoose.model("StylistFeedback", stylistFeedbackSchema);

export { StylistFeedback };
