import { performance } from "node:perf_hooks";
import {
  getRequestId,
  updateRequestContext,
} from "../observability/requestContext.js";
import { logInfo } from "../observability/logger.js";
import { observeMs } from "../observability/metrics.js";

/**
 * Compatibility shim for existing analyze timing helpers.
 * Emits both legacy console lines (when enabled) and structured stage logs.
 */

const PREFIX = "[AI Analyze]";

export const isAiAnalyzeTimingEnabled = () =>
  process.env.AI_ANALYZE_TIMING === "true" ||
  process.env.NODE_ENV === "development";

export const resolveAnalyzeRequestId = (req) => {
  if (req?.requestId) return req.requestId;
  const header = req?.headers?.["x-request-id"];
  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }
  return getRequestId() || "unknown";
};

const roundMs = (value) => Math.round(value * 100) / 100;

export const logAnalyzeStep = (requestId, label, durationMs, layer = "Express") => {
  const ms = roundMs(durationMs);
  if (isAiAnalyzeTimingEnabled()) {
    console.log(`${PREFIX}[${requestId}][${layer}] ${label}: ${ms} ms`);
  }
  logInfo("ai.stage.timed", {
    requestId,
    workflow: "clothing_metadata_generation",
    stage: label,
    layer,
    durationMs: ms,
  });
  observeMs(`analyze.stage.ms`, ms);
};

export const logAnalyzeTotal = (requestId, label, startMs, layer = "Express") => {
  logAnalyzeStep(requestId, label, performance.now() - startMs, layer);
};

export const measureAnalyzeStep = async (
  requestId,
  label,
  fn,
  layer = "Express",
) => {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    logAnalyzeStep(requestId, label, performance.now() - start, layer);
  }
};

export const setAnalyzeWorkflow = () => {
  updateRequestContext({ workflow: "clothing_metadata_generation" });
};
