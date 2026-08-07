import { performance } from "node:perf_hooks";
import {
  analyzeClothingForUser,
  warmupAiClothingService,
} from "../services/aiClothing.service.js";
import { warmupCropService } from "../services/image.service.js";
import {
  logAnalyzeStep,
  logAnalyzeTotal,
  resolveAnalyzeRequestId,
  setAnalyzeWorkflow,
} from "../utils/aiAnalyzeTiming.js";
import { logError, logInfo, hashUserId } from "../observability/logger.js";
import { classifyAiError } from "../observability/errors.js";
import { updateRequestContext } from "../observability/requestContext.js";
import { createTimer } from "../observability/timer.js";
import { observeMs } from "../observability/metrics.js";
import { logPerfBaseline } from "../observability/perfBaseline.js";

const WORKFLOW = "clothing_metadata_generation";

export const warmupAiClothing = async (req, res) => {
  const requestId = resolveAnalyzeRequestId(req);
  updateRequestContext({ workflow: "ai_warmup", requestId });

  // Crop/rembg warmup is the valuable part (loads ONNX into memory).
  // Analysis /warmup only constructs an OpenAI client — still invoked for
  // process wake on Railway, but we do not claim it reduces model TTFT.
  const [aiResult, cropResult] = await Promise.allSettled([
    warmupAiClothingService(requestId),
    warmupCropService(requestId),
  ]);

  const aiWarmedUp = aiResult.status === "fulfilled";
  const cropWarmedUp = cropResult.status === "fulfilled";

  return res.status(200).json({
    status: "accepted",
    success: aiWarmedUp || cropWarmedUp,
    aiWarmedUp,
    cropWarmedUp,
  });
};

export const analyzeClothing = async (req, res) => {
  const requestId = resolveAnalyzeRequestId(req);
  setAnalyzeWorkflow();
  updateRequestContext({
    requestId,
    workflow: WORKFLOW,
    route: req.originalUrl || req.url,
    method: req.method,
  });
  const timer = createTimer();
  let idempotency = null;

  try {
    const validationStart = performance.now();
    const auth0Id = req.auth?.sub;
    const { image } = req.body;

    if (!auth0Id) {
      logInfo("ai.validation.failed", {
        workflow: WORKFLOW,
        reason: "missing_auth",
        classification: "authentication_error",
      });
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    logInfo("ai.request.authenticated", {
      workflow: WORKFLOW,
      userIdHash: hashUserId(auth0Id),
    });

    if (!image || typeof image !== "string") {
      logInfo("ai.validation.failed", {
        workflow: WORKFLOW,
        reason: "image_required",
        classification: "validation_error",
        userIdHash: hashUserId(auth0Id),
      });
      return res.status(400).json({
        success: false,
        message: "image is required",
      });
    }

    const imageKb = Math.round(Buffer.byteLength(image, "utf8") / 1024);
    logAnalyzeStep(
      requestId,
      `request validation (image ~${imageKb} KB base64)`,
      performance.now() - validationStart,
    );
    logInfo("analysis_request_started", {
      workflow: WORKFLOW,
      userIdHash: hashUserId(auth0Id),
      imageKb,
    });

    const {
      beginIdempotentOperation,
      completeIdempotentOperation,
      failIdempotentOperation,
      fingerprintImageBuffer,
      validateIdempotencyKey,
    } = await import("../services/idempotency.service.js");

    const rawKey =
      req.get("Idempotency-Key") || req.body?.idempotencyKey || null;
    if (rawKey) {
      const keyCheck = validateIdempotencyKey(rawKey);
      if (!keyCheck.ok) {
        return res.status(400).json({
          success: false,
          message: `Invalid Idempotency-Key (${keyCheck.reason})`,
        });
      }
      const fingerprint = fingerprintImageBuffer(image, {
        op: "clothing_analyze",
      });
      idempotency = await beginIdempotentOperation({
        auth0Id,
        operationType: "clothing_analyze",
        idempotencyKey: keyCheck.value,
        requestFingerprint: fingerprint,
      });
      if (
        idempotency.kind === "replay" ||
        idempotency.kind === "conflict" ||
        idempotency.kind === "in_progress"
      ) {
        return res.status(idempotency.statusCode).json(idempotency.body);
      }
    }

    const result = await analyzeClothingForUser({ auth0Id, image, requestId });

    const totalMs = timer.elapsedMs();
    observeMs("ai.analyze.controller.ms", totalMs);
    logAnalyzeTotal(requestId, "total controller", timer.start);
    logInfo("analysis_request_completed", {
      workflow: WORKFLOW,
      durationMs: totalMs,
      validTagCount: result.validTagCount,
      creditsDeducted: result.creditsDeducted,
      success: true,
    });
    logPerfBaseline({
      workflow: WORKFLOW,
      totalMs,
      meta: {
        validTagCount: result.validTagCount,
        creditsDeducted: result.creditsDeducted,
      },
    });

    const body = {
      success: true,
      tags: result.tags,
      validTagCount: result.validTagCount,
      creditsDeducted: result.creditsDeducted,
      creditBalance: result.creditBalance,
      timing: { totalMs, workflow: WORKFLOW },
      message:
        result.validTagCount >= 1
          ? "Analysis completed"
          : "Analysis completed with no confident tags",
    };

    if (idempotency?.kind === "execute" && idempotency.record?._id) {
      await completeIdempotentOperation(idempotency.record._id, {
        resultPayload: body,
        creditsDeducted: result.creditsDeducted,
        creditBalance: result.creditBalance,
      });
    }

    return res.status(200).json(body);
  } catch (error) {
    const classified = classifyAiError(error);
    const totalMs = timer.elapsedMs();
    observeMs("ai.analyze.controller.ms", totalMs);
    logAnalyzeTotal(requestId, "total controller (error)", timer.start);
    logError("analysis_request_failed", {
      workflow: WORKFLOW,
      durationMs: totalMs,
      classification: error.classification || classified.classification,
      retryable: classified.retryable,
      status: error.status || classified.status,
      errorMessage: error.message,
    });

    if (idempotency?.kind === "execute" && idempotency.record?._id) {
      await failIdempotentOperation(idempotency.record._id, {
        errorCode: classified.classification || "analyze_failed",
        errorMessage: error.message || "Failed to analyze clothing image",
        terminal: !classified.retryable,
      }).catch(() => {});
    }

    const status = error.status || classified.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to analyze clothing image",
      creditBalance: error.creditBalance,
      creditsDeducted: 0,
    });
  }
};
