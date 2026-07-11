import mongoose from "mongoose";

const stylistFeedbackSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, index: true },
  recommendationId: { type: String, required: true },
  outfitItemIds: [{ type: String }],
  rating: { type: String, enum: ["positive", "negative"], required: true },
  occasion: { type: String },
  style: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const StylistFeedback =
  mongoose.models.StylistFeedback ||
  mongoose.model("StylistFeedback", stylistFeedbackSchema);

export { StylistFeedback };
