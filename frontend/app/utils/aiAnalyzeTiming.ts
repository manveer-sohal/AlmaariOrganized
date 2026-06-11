const PREFIX = "[AI Analyze]";

export const isAiAnalyzeTimingEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_AI_ANALYZE_TIMING === "true" ||
  process.env.NODE_ENV === "development";

const roundMs = (value: number) => Math.round(value * 100) / 100;

export const createClientTraceId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `trace-${Date.now()}`;
};

export const logAnalyzeStep = (
  traceId: string,
  label: string,
  durationMs: number,
  layer = "Frontend",
) => {
  if (!isAiAnalyzeTimingEnabled()) return;
  console.log(
    `${PREFIX}[${traceId}][${layer}] ${label}: ${roundMs(durationMs)} ms`,
  );
};

export const logAnalyzeTotal = (
  traceId: string,
  label: string,
  startMs: number,
  layer = "Frontend",
) => {
  logAnalyzeStep(traceId, label, performance.now() - startMs, layer);
};

export const logAnalyzeGroup = (
  traceId: string,
  title: string,
  steps: Record<string, number>,
) => {
  if (!isAiAnalyzeTimingEnabled()) return;
  console.groupCollapsed(`${PREFIX}[${traceId}] ${title}`);
  Object.entries(steps).forEach(([label, ms]) => {
    console.log(`  ${label}: ${roundMs(ms)} ms`);
  });
  console.groupEnd();
};
