import mongoose from "mongoose";

/**
 * Durable styling-enrichment jobs (MongoDB-backed queue).
 * Survives Cloud Run restarts; claimed atomically via lease.
 */
const EnrichmentJobSchema = new mongoose.Schema(
  {
    clothingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clothes",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    auth0Id: { type: String, default: null },
    status: {
      type: String,
      enum: [
        "pending",
        "leased",
        "completed",
        "failed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    attemptCount: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    leasedUntil: { type: Date, default: null },
    leaseOwner: { type: String, default: null },
    lastError: { type: String, default: null },
    idempotencyKey: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

EnrichmentJobSchema.index(
  { clothingId: 1, status: 1 },
  { partialFilterExpression: { status: { $in: ["pending", "leased"] } } },
);

export const EnrichmentJob =
  mongoose.models.EnrichmentJob ||
  mongoose.model("EnrichmentJob", EnrichmentJobSchema);
