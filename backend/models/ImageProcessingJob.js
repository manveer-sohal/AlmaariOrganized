import mongoose from "mongoose";

/**
 * Durable image processing jobs: crop → derivatives → optional AI analyze stage.
 * Payload stores keys/IDs only — never Base64 bodies.
 */
const ImageProcessingJobSchema = new mongoose.Schema(
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
    jobType: {
      type: String,
      enum: ["image_pipeline", "cleanup"],
      default: "image_pipeline",
    },
    status: {
      type: String,
      enum: ["pending", "leased", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    stage: {
      type: String,
      enum: [
        "verify_source",
        "crop",
        "derivatives",
        "analyze",
        "finalize",
        "cleanup",
        "done",
      ],
      default: "verify_source",
    },
    attemptCount: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5 },
    nextAttemptAt: { type: Date, default: Date.now, index: true },
    leasedUntil: { type: Date, default: null },
    leaseOwner: { type: String, default: null },
    lastError: { type: String, default: null },
    idempotencyKey: { type: String, default: null },
    /** When true, source object is already rembg+framed; skip rembg, validate only. */
    clientCropVerified: { type: Boolean, default: false },
    runAiAnalysis: { type: Boolean, default: false },
    keysToDelete: { type: [String], default: [] },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

ImageProcessingJobSchema.index(
  { clothingId: 1, status: 1, jobType: 1 },
  {
    partialFilterExpression: {
      status: { $in: ["pending", "leased"] },
      jobType: "image_pipeline",
    },
  },
);

export const ImageProcessingJob =
  mongoose.models.ImageProcessingJob ||
  mongoose.model("ImageProcessingJob", ImageProcessingJobSchema);
