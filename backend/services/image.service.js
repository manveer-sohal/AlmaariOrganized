import dotenv from "dotenv";
import { callDownstream } from "../observability/downstream.js";
import { logInfo, logError } from "../observability/logger.js";
import { updateRequestContext, getRequestId } from "../observability/requestContext.js";
import { observeMs, incMetric } from "../observability/metrics.js";
import { createTimer } from "../observability/timer.js";
import { classifyAiError } from "../observability/errors.js";

dotenv.config();

const CROP_SERVICE_URL = process.env.CROP_SERVICE_URL;
const CROP_TIMEOUT_MS = Number(process.env.CROP_TIMEOUT_MS || 15000);
const CROP_WARMUP_TIMEOUT_MS = Number(
  process.env.CROP_WARMUP_TIMEOUT_MS || 8000,
);
const WORKFLOW = "image_crop_processing";

export const toBase64 = (file) => {
  return `data:image/png;base64,${file.toString("base64")}`;
};

export const cropImage = async (base64Image) => {
  updateRequestContext({ workflow: WORKFLOW });
  const timer = createTimer();
  const requestId = getRequestId();

  logInfo("ai.image.processing.started", {
    workflow: WORKFLOW,
    requestId,
    hasImage: Boolean(base64Image),
    imageCharLength: typeof base64Image === "string" ? base64Image.length : 0,
  });
  incMetric("ai.workflow.image_crop_processing.total");

  try {
    const { data, durationMs } = await callDownstream({
      service: "crop",
      method: "POST",
      url: `${CROP_SERVICE_URL}/crop`,
      data: { image: base64Image },
      timeout: CROP_TIMEOUT_MS,
      workflow: WORKFLOW,
      headers: { "Content-Type": "application/json" },
    });

    const totalMs = timer.elapsedMs();
    observeMs("ai.image_crop_processing.ms", totalMs);
    logInfo("ai.image.processing.completed", {
      workflow: WORKFLOW,
      durationMs: totalMs,
      downstreamMs: durationMs,
      success: true,
    });
    incMetric("ai.workflow.image_crop_processing.success");

    return data.image;
  } catch (error) {
    const classified = classifyAiError(error, { service: "crop" });
    const totalMs = timer.elapsedMs();
    observeMs("ai.image_crop_processing.ms", totalMs);
    logError("ai.image.processing.failed", {
      workflow: WORKFLOW,
      durationMs: totalMs,
      classification: classified.classification,
      retryable: classified.retryable,
      status: classified.status,
      errorMessage: error.message,
    });
    incMetric("ai.workflow.image_crop_processing.failed");
    throw {
      status: error.status || classified.status || 500,
      message: error.message || "Error cropping image",
      classification: classified.classification,
    };
  }
};

/** Wake crop worker; no image processing. */
export const warmupCropService = async (requestId) => {
  if (!CROP_SERVICE_URL) {
    logInfo("ai.image.processing.started", {
      workflow: "crop_warmup",
      skipped: true,
      reason: "CROP_SERVICE_URL unset",
    });
    return { success: false, skipped: true };
  }

  try {
    await callDownstream({
      service: "crop",
      method: "GET",
      url: `${CROP_SERVICE_URL}/warmup`,
      timeout: CROP_WARMUP_TIMEOUT_MS,
      workflow: "crop_warmup",
    });
    return { success: true };
  } catch (error) {
    throw {
      status: error.status || 503,
      message: "Crop service warmup failed",
    };
  }
};
