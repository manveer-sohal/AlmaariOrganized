import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { IdempotencyRecord } from "../models/IdempotencyRecord.js";
import connectMongoDB from "../libs/mongodb.js";
import { logInfo, logWarn, hashUserId } from "../observability/logger.js";
import { incMetric } from "../observability/metrics.js";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_KEY_LENGTH = 128;
const KEY_RE = /^[A-Za-z0-9._:-]+$/;

export const validateIdempotencyKey = (key) => {
  if (key == null || key === "") {
    return { ok: false, reason: "missing" };
  }
  const value = String(key).trim();
  if (value.length > MAX_KEY_LENGTH) {
    return { ok: false, reason: "too_long" };
  }
  if (!KEY_RE.test(value)) {
    return { ok: false, reason: "invalid_chars" };
  }
  return { ok: true, value };
};

export const fingerprintImageBuffer = (buffer, extras = {}) => {
  const hash = createHash("sha256");
  if (Buffer.isBuffer(buffer)) {
    hash.update(buffer);
  } else if (typeof buffer === "string") {
    // Hash length + prefix only for data URLs — avoid storing another full copy.
    const trimmed = buffer.startsWith("data:")
      ? buffer.slice(0, 64) + String(buffer.length)
      : buffer.slice(0, 256);
    hash.update(trimmed);
    hash.update(String(buffer.length));
  }
  hash.update(JSON.stringify(extras));
  return hash.digest("hex");
};

export const generateIdempotencyKey = () =>
  `op_${randomBytes(16).toString("hex")}`;

/**
 * Begin or resume an idempotent operation.
 * @returns
 *  - { kind: "execute", record }
 *  - { kind: "replay", record, statusCode, body }
 *  - { kind: "conflict", statusCode, body }
 *  - { kind: "in_progress", statusCode, body }
 */
export const beginIdempotentOperation = async ({
  auth0Id,
  operationType,
  idempotencyKey,
  requestFingerprint,
  ttlMs = DEFAULT_TTL_MS,
}) => {
  await connectMongoDB();
  const keyCheck = validateIdempotencyKey(idempotencyKey);
  if (!keyCheck.ok) {
    return {
      kind: "conflict",
      statusCode: 400,
      body: { error: `Invalid Idempotency-Key (${keyCheck.reason})` },
    };
  }

  const expiresAt = new Date(Date.now() + ttlMs);

  try {
    const created = await IdempotencyRecord.create({
      auth0Id,
      operationType,
      idempotencyKey: keyCheck.value,
      requestFingerprint,
      status: "processing",
      expiresAt,
    });
    logInfo("idempotency_started", {
      operationType,
      userIdHash: hashUserId(auth0Id),
      fingerprintPrefix: requestFingerprint.slice(0, 12),
    });
    return { kind: "execute", record: created };
  } catch (err) {
    if (err?.code !== 11000) throw err;

    const existing = await IdempotencyRecord.findOne({
      auth0Id,
      operationType,
      idempotencyKey: keyCheck.value,
    });

    if (!existing) {
      return {
        kind: "conflict",
        statusCode: 409,
        body: { error: "Idempotency conflict" },
      };
    }

    if (existing.requestFingerprint !== requestFingerprint) {
      incMetric("idempotency_conflict");
      logWarn("idempotency_conflict", {
        operationType,
        userIdHash: hashUserId(auth0Id),
        reason: "fingerprint_mismatch",
      });
      return {
        kind: "conflict",
        statusCode: 409,
        body: {
          error: "Idempotency-Key reused with a different request payload",
        },
      };
    }

    if (existing.status === "completed" && existing.resultPayload) {
      incMetric("idempotency_replay");
      logInfo("idempotency_replay", {
        operationType,
        userIdHash: hashUserId(auth0Id),
        status: "completed",
      });
      return {
        kind: "replay",
        record: existing,
        statusCode: 200,
        body: existing.resultPayload,
      };
    }

    if (
      existing.status === "failed_terminal" ||
      existing.status === "failed_retryable"
    ) {
      return {
        kind: "replay",
        record: existing,
        statusCode: existing.status === "failed_terminal" ? 422 : 503,
        body: {
          error: existing.errorMessage || "Previous operation failed",
          errorCode: existing.errorCode,
          retryable: existing.status === "failed_retryable",
        },
      };
    }

    // processing / started
    return {
      kind: "in_progress",
      record: existing,
      statusCode: 409,
      body: {
        error: "Operation already in progress",
        status: existing.status,
      },
    };
  }
};

export const completeIdempotentOperation = async (
  recordId,
  { resultPayload, clothingId = null, creditsDeducted = 0, creditBalance = null },
) => {
  await connectMongoDB();
  return IdempotencyRecord.findByIdAndUpdate(
    recordId,
    {
      $set: {
        status: "completed",
        resultPayload,
        clothingId,
        creditsDeducted,
        creditBalance,
        errorCode: null,
        errorMessage: null,
      },
    },
    { new: true },
  );
};

export const failIdempotentOperation = async (
  recordId,
  { errorCode, errorMessage, terminal = false },
) => {
  await connectMongoDB();
  return IdempotencyRecord.findByIdAndUpdate(
    recordId,
    {
      $set: {
        status: terminal ? "failed_terminal" : "failed_retryable",
        errorCode: errorCode || "error",
        errorMessage: errorMessage || "Operation failed",
      },
    },
    { new: true },
  );
};

/** Timing-safe compare for service keys (Node). */
export const safeEqualString = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};
