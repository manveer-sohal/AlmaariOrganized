import mongoose from "mongoose";

/**
 * Durable idempotency records for expensive upload / analyze operations.
 * Unique on auth0Id + operationType + idempotencyKey.
 */
const IdempotencyRecordSchema = new mongoose.Schema(
  {
    auth0Id: { type: String, required: true, index: true },
    operationType: {
      type: String,
      required: true,
      enum: ["clothing_upload", "clothing_analyze"],
    },
    idempotencyKey: { type: String, required: true },
    requestFingerprint: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: [
        "started",
        "processing",
        "completed",
        "failed_retryable",
        "failed_terminal",
      ],
      default: "started",
    },
    clothingId: { type: mongoose.Schema.Types.ObjectId, ref: "Clothes", default: null },
    resultPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    creditsDeducted: { type: Number, default: 0 },
    creditBalance: { type: Number, default: null },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

IdempotencyRecordSchema.index(
  { auth0Id: 1, operationType: 1, idempotencyKey: 1 },
  { unique: true },
);

// TTL cleanup after expiresAt (MongoDB TTL monitor).
IdempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IdempotencyRecord =
  mongoose.models.IdempotencyRecord ||
  mongoose.model("IdempotencyRecord", IdempotencyRecordSchema);
