/**
 * Durable image pipeline: verify source → crop (if needed) → derivatives → ready.
 *
 * Canonical invariant: clothing cannot become ready without a validated cropped
 * canonical object. Uncropped source is never used as wardrobe display.
 */

import os from "os";
import { ImageProcessingJob } from "../models/ImageProcessingJob.js";
import { Clothes, User } from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";
import {
  getImageStorageAdapter,
  hashBuffer,
} from "./imageStorage.service.js";
import { buildClothingObjectKey } from "../utils/objectKeyFactory.js";
import { cropImage } from "./image.service.js";
import {
  createDisplayDerivative,
  createThumbnailDerivative,
  validateCroppedImageBuffer,
} from "./derivativeImage.service.js";
import { invalidateUserClothesCache } from "../utils/cacheInvalidation.js";
import { scheduleStylingEnrichment } from "./stylingEnrichment.service.js";
import { logInfo, logWarn, logError, hashUserId } from "../observability/logger.js";
import { incMetric, observeMs } from "../observability/metrics.js";
import { createTimer } from "../observability/timer.js";
import { logPerfBaseline } from "../observability/perfBaseline.js";
import {
  DERIVATIVE_CONTENT_TYPE,
  PROCESSING_IMAGE_PLACEHOLDER,
} from "../constants/imageProcessing.js";

const WORKFLOW = "clothing_image_pipeline";
const LEASE_MS = Number(process.env.IMAGE_PIPELINE_LEASE_MS || process.env.ENRICHMENT_LEASE_MS || 10 * 60 * 1000);
const MAX_ATTEMPTS = Number(process.env.IMAGE_PIPELINE_MAX_ATTEMPTS || 5);
const CONCURRENCY = Math.max(
  1,
  Number(process.env.ENRICHMENT_WORKER_CONCURRENCY || 2),
);
const WORKER_ID = `${os.hostname()}:${process.pid}`;

const backoffMs = (attempt) => {
  const base = Math.min(60_000, 2_000 * 2 ** Math.max(0, attempt - 1));
  return base + Math.floor(Math.random() * 500);
};

const stripDataUrl = (value) => {
  if (typeof value !== "string") return value;
  const idx = value.indexOf(",");
  return idx >= 0 ? value.slice(idx + 1) : value;
};

export const enqueueImageProcessingJob = async (
  clothingId,
  {
    auth0Id,
    clientCropVerified = false,
    runAiAnalysis = false,
    idempotencyKey = null,
  } = {},
) => {
  await connectMongoDB();
  const clothing = await Clothes.findById(clothingId).select("_id userId imageStorage").lean();
  if (!clothing) return { enqueued: false, reason: "missing_clothing" };

  if (clothing.imageStorage?.status === "ready") {
    return { enqueued: false, reason: "already_ready" };
  }

  const existing = await ImageProcessingJob.findOne({
    clothingId: clothing._id,
    jobType: "image_pipeline",
    status: { $in: ["pending", "leased"] },
  });
  if (existing) {
    return { enqueued: false, reason: "already_queued", job: existing };
  }

  let resolvedAuth0 = auth0Id || null;
  if (!resolvedAuth0) {
    const user = await User.findById(clothing.userId).select("auth0Id").lean();
    resolvedAuth0 = user?.auth0Id || null;
  }

  const job = await ImageProcessingJob.create({
    clothingId: clothing._id,
    userId: clothing.userId,
    auth0Id: resolvedAuth0,
    jobType: "image_pipeline",
    status: "pending",
    stage: "verify_source",
    clientCropVerified: Boolean(clientCropVerified),
    runAiAnalysis: Boolean(runAiAnalysis),
    idempotencyKey,
    maxAttempts: MAX_ATTEMPTS,
    nextAttemptAt: new Date(),
  });

  incMetric("image_pipeline_job_created");
  logInfo("image_pipeline_job_created", {
    workflow: WORKFLOW,
    clothingId: String(clothing._id),
    jobId: String(job._id),
    userIdHash: hashUserId(resolvedAuth0),
    clientCropVerified: Boolean(clientCropVerified),
  });

  return { enqueued: true, job };
};

const claimNextJob = async () => {
  const now = new Date();
  return ImageProcessingJob.findOneAndUpdate(
    {
      jobType: "image_pipeline",
      $or: [
        { status: "pending", nextAttemptAt: { $lte: now } },
        { status: "leased", leasedUntil: { $lte: now } },
      ],
    },
    {
      $set: {
        status: "leased",
        leasedUntil: new Date(now.getTime() + LEASE_MS),
        leaseOwner: WORKER_ID,
      },
      $inc: { attemptCount: 1 },
    },
    { sort: { nextAttemptAt: 1 }, new: true },
  );
};

const renewLease = async (jobId) => {
  await ImageProcessingJob.updateOne(
    { _id: jobId, leaseOwner: WORKER_ID, status: "leased" },
    { $set: { leasedUntil: new Date(Date.now() + LEASE_MS) } },
  );
};

const markFailed = async (job, clothing, reason, terminal = false) => {
  const attempts = job.attemptCount || 1;
  const exhausted = terminal || attempts >= (job.maxAttempts || MAX_ATTEMPTS);
  if (clothing) {
    await Clothes.updateOne(
      { _id: clothing._id },
      {
        $set: {
          "imageStorage.status": "crop_failed",
          "imageStorage.lastError": String(reason || "crop_failed").slice(0, 500),
        },
      },
    );
  }
  if (exhausted) {
    await ImageProcessingJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "failed",
          lastError: String(reason || "failed").slice(0, 500),
          completedAt: new Date(),
        },
      },
    );
  } else {
    await ImageProcessingJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "pending",
          leaseOwner: null,
          leasedUntil: null,
          lastError: String(reason || "retry").slice(0, 500),
          nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
        },
      },
    );
  }
  logWarn("image_pipeline_job_failed", {
    workflow: WORKFLOW,
    clothingId: String(job.clothingId),
    jobId: String(job._id),
    reason,
    exhausted,
  });
};

export const processImagePipelineJob = async (job) => {
  const timer = createTimer();
  const stages = {};
  await connectMongoDB();

  const clothing = await Clothes.findById(job.clothingId);
  if (!clothing) {
    await ImageProcessingJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "cancelled",
          lastError: "clothing_deleted",
          completedAt: new Date(),
        },
      },
    );
    return { ok: true, cancelled: true };
  }

  if (clothing.imageStorage?.status === "ready" && clothing.imageStorage?.canonical?.key) {
    await ImageProcessingJob.updateOne(
      { _id: job._id },
      { $set: { status: "completed", stage: "done", completedAt: new Date() } },
    );
    return { ok: true, reused: true };
  }

  const storage = await getImageStorageAdapter();
  if (storage.provider !== "s3") {
    await markFailed(job, clothing, "object_storage_not_configured", true);
    return { ok: false };
  }

  const sourceKey = clothing.imageStorage?.source?.key;
  if (!sourceKey) {
    await markFailed(job, clothing, "missing_source_key", true);
    return { ok: false };
  }

  try {
    await Clothes.updateOne(
      { _id: clothing._id },
      { $set: { "imageStorage.status": "cropping" } },
    );
    await renewLease(job._id);

    // --- retrieve source ---
    let t0 = createTimer();
    const sourceBuffer = await storage.getObjectBuffer(sourceKey);
    stages.sourceRetrievalMs = t0.elapsedMs();

    let canonicalBuffer;
    let cropMode = clothing.imageStorage?.cropMode || null;

    if (job.clientCropVerified || clothing.imageStorage?.clientCropVerified) {
      // Source is already rembg+framed (crop service already ran on client path).
      // Validate — do not silently treat invalid buffers as ready.
      t0 = createTimer();
      const validation = await validateCroppedImageBuffer(sourceBuffer);
      stages.cropValidationMs = t0.elapsedMs();
      if (!validation.ok) {
        await markFailed(job, clothing, `invalid_client_crop:${validation.reason}`);
        return { ok: false };
      }
      canonicalBuffer = sourceBuffer;
      cropMode = cropMode || "client_framed_rembg";
    } else {
      // Mandatory server crop (subject_square = rembg + square pad).
      t0 = createTimer();
      const base64 = sourceBuffer.toString("base64");
      const croppedB64 = await cropImage(base64, { mode: "subject_square" });
      stages.cropMs = t0.elapsedMs();
      canonicalBuffer = Buffer.from(stripDataUrl(croppedB64), "base64");
      const validation = await validateCroppedImageBuffer(canonicalBuffer);
      if (!validation.ok) {
        await markFailed(job, clothing, `invalid_server_crop:${validation.reason}`);
        return { ok: false };
      }
      cropMode = "subject_square";
    }

    await renewLease(job._id);

    // Reuse existing canonical if present and valid
    let canonicalKey = clothing.imageStorage?.canonical?.key || null;
    if (canonicalKey && (await storage.objectExists(canonicalKey))) {
      logInfo("image_pipeline_canonical_reused", {
        workflow: WORKFLOW,
        clothingId: String(clothing._id),
      });
    } else {
      t0 = createTimer();
      const version = (clothing.imageStorage?.canonical?.version || 0) + 1;
      canonicalKey = buildClothingObjectKey({
        userId: String(clothing.userId),
        clothingId: String(clothing._id),
        variant: "canonical",
        version,
        ext: "png",
      });
      await storage.putObject({
        key: canonicalKey,
        body: canonicalBuffer,
        contentType: "image/png",
      });
      stages.canonicalUploadMs = t0.elapsedMs();
    }

    // Derivatives from canonical crop only
    t0 = createTimer();
    const display = await createDisplayDerivative(canonicalBuffer);
    const thumb = await createThumbnailDerivative(canonicalBuffer);
    stages.derivativeMs = t0.elapsedMs();

    const version = clothing.imageStorage?.canonical?.version || 1;
    const displayKey = buildClothingObjectKey({
      userId: String(clothing.userId),
      clothingId: String(clothing._id),
      variant: "display",
      version,
      ext: "webp",
    });
    const thumbnailKey = buildClothingObjectKey({
      userId: String(clothing.userId),
      clothingId: String(clothing._id),
      variant: "thumbnail",
      version,
      ext: "webp",
    });

    t0 = createTimer();
    await storage.putObject({
      key: displayKey,
      body: display.buffer,
      contentType: DERIVATIVE_CONTENT_TYPE,
    });
    await storage.putObject({
      key: thumbnailKey,
      body: thumb.buffer,
      contentType: DERIVATIVE_CONTENT_TYPE,
    });
    stages.derivativeUploadMs = t0.elapsedMs();

    const displayUrl = storage.getPublicDeliveryUrl(displayKey);
    const thumbnailUrl = storage.getPublicDeliveryUrl(thumbnailKey);
    const canonicalUrl = storage.getPublicDeliveryUrl(canonicalKey);

    await Clothes.updateOne(
      { _id: clothing._id },
      {
        $set: {
          // Prefer CDN display URL in imageSrc for legacy FE readers (not Base64).
          imageSrc: displayUrl || canonicalUrl || PROCESSING_IMAGE_PLACEHOLDER,
          imageStorage: {
            provider: "s3",
            status: "ready",
            clientCropVerified: Boolean(
              job.clientCropVerified || clothing.imageStorage?.clientCropVerified,
            ),
            cropMode,
            source: clothing.imageStorage?.source || { key: sourceKey },
            canonical: {
              key: canonicalKey,
              contentType: "image/png",
              width: display.width,
              height: display.height,
              bytes: canonicalBuffer.length,
              version,
            },
            display: {
              key: displayKey,
              contentType: DERIVATIVE_CONTENT_TYPE,
              width: display.width,
              height: display.height,
              bytes: display.bytes,
            },
            thumbnail: {
              key: thumbnailKey,
              contentType: DERIVATIVE_CONTENT_TYPE,
              width: thumb.width,
              height: thumb.height,
              bytes: thumb.bytes,
            },
            displayUrl,
            thumbnailUrl,
            displayKey,
            thumbnailKey,
            originalKey: sourceKey,
            checksum: hashBuffer(canonicalBuffer),
            croppedAt: new Date(),
            uploadedAt: clothing.imageStorage?.uploadedAt || new Date(),
            lastError: null,
          },
        },
      },
    );

    if (job.auth0Id) {
      await invalidateUserClothesCache(job.auth0Id);
    }

    // Styling enrichment remains a separate free durable job (metadata).
    scheduleStylingEnrichment(clothing._id);

    await ImageProcessingJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "completed",
          stage: "done",
          completedAt: new Date(),
          lastError: null,
        },
      },
    );

    const totalMs = timer.elapsedMs();
    observeMs("image_pipeline.ms", totalMs);
    incMetric("image_pipeline_job_completed");
    logPerfBaseline({
      workflow: WORKFLOW,
      totalMs,
      stages,
      meta: { clothingId: String(clothing._id), cropMode },
    });
    logInfo("image_pipeline_job_completed", {
      workflow: WORKFLOW,
      clothingId: String(clothing._id),
      jobId: String(job._id),
      durationMs: totalMs,
      stages,
    });

    return { ok: true, stages };
  } catch (err) {
    logError("image_pipeline_job_error", {
      workflow: WORKFLOW,
      clothingId: String(job.clothingId),
      errorMessage: err?.message,
    });
    const retryable = !/unsupported|undecodable|invalid_|missing_/.test(
      String(err?.message || ""),
    );
    await markFailed(job, clothing, err?.message || "pipeline_error", !retryable);
    return { ok: false, error: err?.message };
  }
};

export const processDueImagePipelineJobs = async ({ limit } = {}) => {
  const max = Math.min(
    Number(limit) || CONCURRENCY,
    Math.max(CONCURRENCY, 1) * 2,
  );
  const results = [];
  // Bound concurrency — never unbounded Promise.all over the whole queue.
  const workers = Array.from({ length: Math.min(CONCURRENCY, max) }, async () => {
    while (results.length < max) {
      const job = await claimNextJob();
      if (!job) break;
      const result = await processImagePipelineJob(job);
      results.push({ jobId: String(job._id), ...result });
    }
  });
  await Promise.all(workers);
  return results;
};

export const scheduleImagePipeline = (clothingId, opts = {}) => {
  enqueueImageProcessingJob(clothingId, opts)
    .then(() => {
      setImmediate(() => {
        processDueImagePipelineJobs({ limit: CONCURRENCY }).catch((err) => {
          logWarn("image_pipeline_kick_failed", { errorMessage: err?.message });
        });
      });
    })
    .catch((err) => {
      logWarn("image_pipeline_enqueue_failed", { errorMessage: err?.message });
    });
};

export const enqueueCleanupJob = async (clothingId, keys, { auth0Id, userId } = {}) => {
  if (!keys?.length) return { enqueued: false };
  await connectMongoDB();
  const job = await ImageProcessingJob.create({
    clothingId,
    userId,
    auth0Id: auth0Id || null,
    jobType: "cleanup",
    status: "pending",
    stage: "cleanup",
    keysToDelete: keys,
    nextAttemptAt: new Date(),
  });
  return { enqueued: true, job };
};

export const processCleanupJobs = async ({ limit = 10 } = {}) => {
  const storage = await getImageStorageAdapter();
  const results = [];
  for (let i = 0; i < limit; i++) {
    const job = await ImageProcessingJob.findOneAndUpdate(
      {
        jobType: "cleanup",
        $or: [
          { status: "pending", nextAttemptAt: { $lte: new Date() } },
          { status: "leased", leasedUntil: { $lte: new Date() } },
        ],
      },
      {
        $set: {
          status: "leased",
          leasedUntil: new Date(Date.now() + LEASE_MS),
          leaseOwner: WORKER_ID,
        },
      },
      { sort: { nextAttemptAt: 1 }, new: true },
    );
    if (!job) break;
    try {
      if (storage.provider === "s3") {
        await storage.deleteObjects(job.keysToDelete || []);
      }
      await ImageProcessingJob.updateOne(
        { _id: job._id },
        { $set: { status: "completed", stage: "done", completedAt: new Date() } },
      );
      results.push({ ok: true, jobId: String(job._id) });
    } catch (err) {
      await ImageProcessingJob.updateOne(
        { _id: job._id },
        {
          $set: {
            status: "pending",
            lastError: err?.message,
            nextAttemptAt: new Date(Date.now() + backoffMs(job.attemptCount || 1)),
          },
        },
      );
      results.push({ ok: false, jobId: String(job._id) });
    }
  }
  return results;
};
