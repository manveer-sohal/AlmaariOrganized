import dotenv from "dotenv";
import { performance } from "node:perf_hooks";
import {
  countValidTags,
  sanitizeTagsPayload,
} from "../utils/tagValidation.utils.js";
import {
  logAnalyzeStep,
  logAnalyzeTotal,
  measureAnalyzeStep,
  setAnalyzeWorkflow,
} from "../utils/aiAnalyzeTiming.js";
import {
  deductOneCredit,
  getCreditBalance,
  refundCredits,
} from "./credit.service.js";
import { callDownstream } from "../observability/downstream.js";
import { logError, logInfo, hashUserId } from "../observability/logger.js";
import { classifyAiError } from "../observability/errors.js";
import { incMetric, observeMs } from "../observability/metrics.js";
import { createTimer } from "../observability/timer.js";
import { getRequestId } from "../observability/requestContext.js";

dotenv.config();

const AI_CLOTHING_SERVICE_URL = process.env.AI_CLOTHING_SERVICE_URL;
const AI_CLOTHING_TIMEOUT_MS = Number(
  process.env.AI_CLOTHING_TIMEOUT_MS || 60000,
);
const AI_WARMUP_TIMEOUT_MS = Number(process.env.AI_WARMUP_TIMEOUT_MS || 8000);
const WORKFLOW = "clothing_metadata_generation";

const stripDataUrl = (image) => {
  const trimmed = String(image || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) {
    const commaIndex = trimmed.indexOf(",");
    if (commaIndex === -1) return "";
    return trimmed.slice(commaIndex + 1);
  }
  return trimmed;
};

export const callAiClothingService = async (image, requestId) => {
  const stripStart = performance.now();
  const payloadImage = stripDataUrl(image);
  logAnalyzeStep(
    requestId,
    "strip data URL / prep payload",
    performance.now() - stripStart,
  );

  if (!payloadImage) {
    throw { status: 400, message: "image is required" };
  }

  const payloadKb = Math.round((payloadImage.length * 3) / 4 / 1024);
  logInfo("ai.image.prepared", {
    workflow: WORKFLOW,
    imageKb: payloadKb,
  });

  logInfo("ai.inference.started", {
    workflow: WORKFLOW,
    destinationService: "fastapi-ai",
    endpoint: `${AI_CLOTHING_SERVICE_URL}/analyze-clothing`,
  });

  try {
    const { data, durationMs } = await callDownstream({
      service: "fastapi-ai",
      method: "POST",
      url: `${AI_CLOTHING_SERVICE_URL}/analyze-clothing`,
      data: { image: payloadImage },
      timeout: AI_CLOTHING_TIMEOUT_MS,
      workflow: WORKFLOW,
      headers: { "Content-Type": "application/json" },
    });

    logAnalyzeStep(
      requestId,
      `FastAPI HTTP round-trip (~${payloadKb} KB payload)`,
      durationMs,
    );

    const sanitizeStart = performance.now();
    const tags = sanitizeTagsPayload(data);
    const validTagCount = countValidTags(tags);
    const sanitizeMs = performance.now() - sanitizeStart;
    logAnalyzeStep(
      requestId,
      "response sanitize / tag validation",
      sanitizeMs,
    );

    if (validTagCount < 1) {
      logInfo("ai.response.validation.failed", {
        workflow: WORKFLOW,
        validTagCount,
        durationMs: Math.round(sanitizeMs * 100) / 100,
      });
    } else {
      logInfo("ai.inference.completed", {
        workflow: WORKFLOW,
        validTagCount,
        durationMs,
      });
    }

    return { tags, validTagCount };
  } catch (error) {
    if (error.status && error.classification) throw error;

    if (error.code === "ECONNABORTED") {
      throw {
        status: 504,
        message: "Clothing analysis timed out",
        classification: "model_timeout",
        retryable: true,
      };
    }

    throw error;
  }
};

/** Wake FastAPI worker; no analysis, no credits, no OpenAI inference. */
export const warmupAiClothingService = async (requestId) => {
  try {
    await callDownstream({
      service: "fastapi-ai",
      method: "GET",
      url: `${AI_CLOTHING_SERVICE_URL}/warmup`,
      timeout: AI_WARMUP_TIMEOUT_MS,
      workflow: "ai_warmup",
    });
    logAnalyzeStep(requestId || "warmup", "FastAPI warmup", 0);
    return { success: true };
  } catch (error) {
    logAnalyzeStep(
      requestId || "warmup",
      "FastAPI warmup failed (non-fatal)",
      0,
    );
    throw {
      status: error.status || 503,
      message: "AI service warmup failed",
    };
  }
};

export const analyzeClothingForUser = async ({ auth0Id, image, requestId }) => {
  setAnalyzeWorkflow();
  const timer = createTimer();
  const rid = requestId || getRequestId();
  incMetric("ai.requests.total");
  incMetric("ai.workflow.clothing_metadata_generation.total");

  logInfo("ai.credits.checked", {
    workflow: WORKFLOW,
    userIdHash: hashUserId(auth0Id),
  });

  let deduction;
  try {
    deduction = await measureAnalyzeStep(
      rid,
      "credit reservation (deductOneCredit)",
      () => deductOneCredit(auth0Id),
    );
  } catch (error) {
    const classified = classifyAiError(error);
    incMetric("ai.requests.failed");
    incMetric("ai.validation.insufficient_credits");
    logError("ai.credits.checked", {
      workflow: WORKFLOW,
      userIdHash: hashUserId(auth0Id),
      classification: classified.classification,
      status: classified.status,
      success: false,
      errorMessage: error.message,
    });
    const balance = await getCreditBalance(auth0Id).catch(() => undefined);
    throw {
      status: error.status || 402,
      message: error.message || "Insufficient credits",
      creditBalance: balance,
      classification: classified.classification,
    };
  }

  try {
    const { tags, validTagCount } = await callAiClothingService(image, rid);

    if (validTagCount < 1) {
      const refund = await measureAnalyzeStep(
        rid,
        "credit refund (no confident tags)",
        () => refundCredits(auth0Id, 1),
      );
      logInfo("ai.credit.refund.completed", {
        workflow: WORKFLOW,
        reason: "no_confident_tags",
        userIdHash: hashUserId(auth0Id),
      });
      incMetric("ai.credit.refunds");
      logAnalyzeStep(rid, "credit charge waived (validTagCount < 1)", 0);

      const totalMs = timer.elapsedMs();
      observeMs("ai.clothing_metadata_generation.ms", totalMs);
      logAnalyzeTotal(rid, "total service (analyzeClothingForUser)", timer.start);
      incMetric("ai.requests.success");

      return {
        tags,
        validTagCount,
        creditsDeducted: 0,
        creditBalance: refund.creditBalance,
      };
    }

    const totalMs = timer.elapsedMs();
    observeMs("ai.clothing_metadata_generation.ms", totalMs);
    logAnalyzeTotal(rid, "total service (analyzeClothingForUser)", timer.start);
    logInfo("ai.request.completed", {
      workflow: WORKFLOW,
      durationMs: totalMs,
      validTagCount,
      creditsDeducted: deduction.creditsDeducted,
      success: true,
    });
    incMetric("ai.requests.success");

    return {
      tags,
      validTagCount,
      creditsDeducted: deduction.creditsDeducted,
      creditBalance: deduction.creditBalance,
    };
  } catch (error) {
    try {
      await refundCredits(auth0Id, 1);
      logInfo("ai.credit.refund.completed", {
        workflow: WORKFLOW,
        reason: "inference_or_downstream_failure",
        userIdHash: hashUserId(auth0Id),
      });
      incMetric("ai.credit.refunds");
    } catch (refundError) {
      logError("ai.credit.refund.failed", {
        workflow: WORKFLOW,
        errorMessage: refundError?.message,
      });
    }

    const classified = classifyAiError(error);
    const totalMs = timer.elapsedMs();
    observeMs("ai.clothing_metadata_generation.ms", totalMs);
    logAnalyzeTotal(
      rid,
      "total service (analyzeClothingForUser, error)",
      timer.start,
    );
    logError("ai.inference.failed", {
      workflow: WORKFLOW,
      durationMs: totalMs,
      classification: classified.classification,
      retryable: classified.retryable,
      status: classified.status,
      errorMessage: error.message,
    });
    incMetric("ai.requests.failed");

    const balance = await getCreditBalance(auth0Id).catch(
      () => deduction.creditBalance,
    );

    throw {
      status: error.status || classified.status || 500,
      message: error.message || "Failed to analyze clothing image",
      creditBalance: balance,
      classification: classified.classification,
    };
  }
};
