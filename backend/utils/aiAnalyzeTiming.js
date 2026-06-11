import { randomUUID } from "crypto";
import { performance } from "node:perf_hooks";

const PREFIX = "[AI Analyze]";

export const isAiAnalyzeTimingEnabled = () =>
  process.env.AI_ANALYZE_TIMING === "true" ||
  process.env.NODE_ENV === "development";

export const resolveAnalyzeRequestId = (req) => {
  const header = req?.headers?.["x-request-id"];
  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }
  return randomUUID();
};

const roundMs = (value) => Math.round(value * 100) / 100;

export const logAnalyzeStep = (requestId, label, durationMs, layer = "Express") => {
  if (!isAiAnalyzeTimingEnabled()) return;
  console.log(
    `${PREFIX}[${requestId}][${layer}] ${label}: ${roundMs(durationMs)} ms`,
  );
};

export const logAnalyzeTotal = (requestId, label, startMs, layer = "Express") => {
  logAnalyzeStep(requestId, label, performance.now() - startMs, layer);
};

export const measureAnalyzeStep = async (requestId, label, fn, layer = "Express") => {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    logAnalyzeStep(requestId, label, performance.now() - start, layer);
  }
};
