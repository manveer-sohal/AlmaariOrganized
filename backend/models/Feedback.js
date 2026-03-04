import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  auth0Id: { type: String, ref: "User", required: true },
  email: { type: String, required: true },
  type: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, required: true, default: "medium" },
  createdAt: { type: Date, default: Date.now },
});

const Feedback =
  mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);

export { Feedback };
