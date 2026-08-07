import os from "os";
import { EnrichmentJob } from "../models/EnrichmentJob.js";
import { Clothes, User } from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";
import { enrichClothingStyling } from "./stylingEnrichment.service.js";
import { logInfo, logWarn, logError, hashUserId } from "../observability/logger.js";
import { incMetric, observeMs } from "../observability/metrics.js";
import { createTimer } from "../observability/timer.js";

const WORKFLOW = "clothing_styling_enrichment";
const LEASE_MS = Number(process.env.ENRICHMENT_LEASE_MS || 5 * 60 * 1000);
const MAX_ATTEMPTS = Number(process.env.ENRICHMENT_MAX_ATTEMPTS || 5);
const WORKER_ID = `${os.hostname()}:${process.pid}`;

const backoffMs = (attempt) => {
  const base = Math.min(60_000, 2_000 * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 500);
  return base + jitter;
};

/**
 * Persist a durable enrichment job (idempotent per clothing pending/leased).
 * Does not embed Base64 image data — worker loads clothing by ID.
 */
export const enqueueEnrichmentJob = async (clothingId, { auth0Id } = {}) => {
  await connectMongoDB();
  const clothing = await Clothes.findById(clothingId)
    .select("_id userId stylingMetadata.enrichmentStatus")
    .lean();
  if (!clothing) {
    return { enqueued: false, reason: "missing_clothing" };
  }

  const status = clothing.stylingMetadata?.enrichmentStatus;
  if (status === "completed") {
    return { enqueued: false, reason: "already_completed" };
  }

  let resolvedAuth0 = auth0Id || null;
  if (!resolvedAuth0) {
    const user = await User.findById(clothing.userId).select("auth0Id").lean();
    resolvedAuth0 = user?.auth0Id || null;
  }

  const existing = await EnrichmentJob.findOne({
    clothingId: clothing._id,
    status: { $in: ["pending", "leased"] },
  });
  if (existing) {
    logInfo("enrichment_job_deduped", {
      workflow: WORKFLOW,
      clothingId: String(clothing._id),
      jobId: String(existing._id),
    });
    return { enqueued: false, reason: "already_queued", job: existing };
  }

  const job = await EnrichmentJob.create({
    clothingId: clothing._id,
    userId: clothing.userId,
    auth0Id: resolvedAuth0,
    status: "pending",
    attemptCount: 0,
    maxAttempts: MAX_ATTEMPTS,
    nextAttemptAt: new Date(),
  });

  incMetric("enrichment_job_created");
  logInfo("enrichment_job_created", {
    workflow: WORKFLOW,
    clothingId: String(clothing._id),
    jobId: String(job._id),
    userIdHash: hashUserId(resolvedAuth0),
  });

  return { enqueued: true, job };
};

const claimNextJob = async () => {
  const now = new Date();
  return EnrichmentJob.findOneAndUpdate(
    {
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

export const processEnrichmentJob = async (job) => {
  const timer = createTimer();
  const clothingId = job.clothingId;
  logInfo("enrichment_job_started", {
    workflow: WORKFLOW,
    jobId: String(job._id),
    clothingId: String(clothingId),
    attempt: job.attemptCount,
  });
  incMetric("enrichment_job_started");

  const clothing = await Clothes.findById(clothingId)
    .select("_id stylingMetadata.enrichmentStatus")
    .lean();

  if (!clothing) {
    await EnrichmentJob.findByIdAndUpdate(job._id, {
      $set: {
        status: "cancelled",
        lastError: "clothing_deleted",
        completedAt: new Date(),
        leasedUntil: null,
      },
    });
    return { status: "cancelled" };
  }

  if (clothing.stylingMetadata?.enrichmentStatus === "completed") {
    await EnrichmentJob.findByIdAndUpdate(job._id, {
      $set: {
        status: "completed",
        completedAt: new Date(),
        leasedUntil: null,
        lastError: null,
      },
    });
    return { status: "completed", skipped: true };
  }

  try {
    const result = await enrichClothingStyling(clothingId, { force: false });
    const durationMs = timer.elapsedMs();
    observeMs("enrichment_job_execution.ms", durationMs);

    if (!result) {
      throw new Error("enrichment returned null");
    }

    await EnrichmentJob.findByIdAndUpdate(job._id, {
      $set: {
        status: "completed",
        completedAt: new Date(),
        leasedUntil: null,
        lastError: null,
      },
    });
    incMetric("enrichment_job_completed");
    logInfo("enrichment_job_completed", {
      workflow: WORKFLOW,
      jobId: String(job._id),
      clothingId: String(clothingId),
      durationMs,
    });
    return { status: "completed" };
  } catch (error) {
    const durationMs = timer.elapsedMs();
    const attempts = job.attemptCount || 1;
    const terminal = attempts >= (job.maxAttempts || MAX_ATTEMPTS);
    const nextAttemptAt = new Date(Date.now() + backoffMs(attempts));

    await EnrichmentJob.findByIdAndUpdate(job._id, {
      $set: {
        status: terminal ? "failed" : "pending",
        lastError: error?.message || "enrichment_failed",
        nextAttemptAt: terminal ? undefined : nextAttemptAt,
        leasedUntil: null,
        leaseOwner: null,
        ...(terminal ? { completedAt: new Date() } : {}),
      },
    });

    incMetric("enrichment_job_failed");
    logError("enrichment_job_failed", {
      workflow: WORKFLOW,
      jobId: String(job._id),
      clothingId: String(clothingId),
      attempt: attempts,
      terminal,
      durationMs,
      errorMessage: error?.message,
    });
    return { status: terminal ? "failed" : "retry_scheduled" };
  }
};

/** Claim and process up to `limit` due jobs. */
export const processDueEnrichmentJobs = async ({ limit = 5 } = {}) => {
  await connectMongoDB();
  const results = [];
  for (let i = 0; i < limit; i += 1) {
    const job = await claimNextJob();
    if (!job) break;
    results.push(await processEnrichmentJob(job));
  }
  return results;
};

/**
 * Enqueue durable job and best-effort kick processing in this process.
 * Job survives restart even if the kick is lost.
 */
export const scheduleDurableEnrichment = async (clothingId, options = {}) => {
  const { job, enqueued, reason } = await enqueueEnrichmentJob(clothingId, options);

  // Best-effort in-process kick (not the durability source of truth).
  setImmediate(() => {
    Promise.resolve()
      .then(async () => {
        if (job?._id) {
          const fresh = await EnrichmentJob.findById(job._id);
          if (fresh && (fresh.status === "pending" || fresh.status === "leased")) {
            // Re-claim via processDue to keep lease semantics consistent.
            await processDueEnrichmentJobs({ limit: 3 });
            return;
          }
        }
        await processDueEnrichmentJobs({ limit: 3 });
      })
      .catch((error) => {
        logWarn("enrichment_kick_failed", {
          clothingId: String(clothingId),
          errorMessage: error?.message,
        });
      });
  });

  return { enqueued, reason, jobId: job?._id ? String(job._id) : null };
};
