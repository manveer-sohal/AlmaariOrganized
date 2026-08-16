/**
 * Stable, greppable performance baselines for before/after latency comparisons.
 *
 * Search logs for: PERF_BASELINE
 * Or JSON event: "event":"perf.baseline"
 */
import { logInfo } from "./logger.js";
import { observeMs } from "./metrics.js";

/**
 * @param {object} args
 * @param {string} args.workflow - Stable name, e.g. outfit_recommendation
 * @param {number} args.totalMs
 * @param {Record<string, number>=} args.stages - Optional stage breakdown (ms)
 * @param {Record<string, unknown>=} args.meta - Safe non-PII context
 */
export const logPerfBaseline = ({
  workflow,
  totalMs,
  stages = undefined,
  meta = undefined,
}) => {
  const rounded =
    typeof totalMs === "number" ? Math.round(totalMs * 100) / 100 : undefined;
  if (rounded == null || Number.isNaN(rounded)) return;

  observeMs(`perf.baseline.${workflow}.ms`, rounded);

  logInfo("perf.baseline", {
    workflow,
    totalMs: rounded,
    ...(stages && Object.keys(stages).length ? { stages } : {}),
    ...(meta && Object.keys(meta).length ? { meta } : {}),
  });

  // Human-readable line for local docker / Cloud Logging text search
  const stagePart =
    stages && Object.keys(stages).length
      ? ` stages=${JSON.stringify(stages)}`
      : "";
  console.log(
    `[PERF_BASELINE] workflow=${workflow} totalMs=${rounded}${stagePart}`,
  );
};
