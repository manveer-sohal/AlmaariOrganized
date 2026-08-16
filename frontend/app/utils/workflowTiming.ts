/**
 * Client-side performance baselines for before/after latency comparisons.
 *
 * Grep browser console or copied logs for: PERF_BASELINE
 * Enable with NEXT_PUBLIC_AI_ANALYZE_TIMING=true (or any NODE_ENV=development).
 */

const PREFIX = "PERF_BASELINE";

export const isWorkflowTimingEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_AI_ANALYZE_TIMING === "true" ||
  process.env.NODE_ENV === "development";

const roundMs = (value: number) => Math.round(value * 100) / 100;

export type WorkflowTimingReport = {
  workflow: string;
  totalMs: number;
  stages?: Record<string, number>;
  traceId?: string;
  meta?: Record<string, string | number | boolean | null | undefined>;
};

/** One greppable summary line + structured console group. */
export const logPerfBaseline = (report: WorkflowTimingReport) => {
  if (!isWorkflowTimingEnabled()) return;

  const totalMs = roundMs(report.totalMs);
  const stages = report.stages
    ? Object.fromEntries(
        Object.entries(report.stages).map(([k, v]) => [k, roundMs(v)]),
      )
    : undefined;

  const stagePart = stages ? ` stages=${JSON.stringify(stages)}` : "";
  const tracePart = report.traceId ? ` traceId=${report.traceId}` : "";
  const metaPart = report.meta ? ` meta=${JSON.stringify(report.meta)}` : "";

  console.log(
    `[${PREFIX}] workflow=${report.workflow} totalMs=${totalMs}${stagePart}${tracePart}${metaPart}`,
  );

  if (stages && Object.keys(stages).length) {
    console.groupCollapsed(
      `[${PREFIX}] ${report.workflow} breakdown (${totalMs} ms)`,
    );
    Object.entries(stages).forEach(([label, ms]) => {
      console.log(`  ${label}: ${ms} ms`);
    });
    console.groupEnd();
  }
};

/** Accumulates stage timings for a single user session / form flow. */
export class WorkflowSession {
  workflow: string;
  traceId: string;
  stages: Record<string, number> = {};
  meta: Record<string, string | number | boolean | null | undefined> = {};

  constructor(workflow: string, traceId: string) {
    this.workflow = workflow;
    this.traceId = traceId;
  }

  setMeta(
    key: string,
    value: string | number | boolean | null | undefined,
  ): void {
    this.meta[key] = value;
  }

  mark(stage: string, durationMs: number): void {
    this.stages[stage] = roundMs(durationMs);
  }

  /** Sum of recorded stages (active work), not wall-clock including user idle. */
  pipelineTotalMs(): number {
    return Object.values(this.stages).reduce((sum, ms) => sum + ms, 0);
  }

  logStageBaseline(stageWorkflow: string, stage: string, durationMs: number) {
    this.mark(stage, durationMs);
    logPerfBaseline({
      workflow: stageWorkflow,
      totalMs: durationMs,
      stages: { [stage]: durationMs },
      traceId: this.traceId,
      meta: this.meta,
    });
  }

  /** Emit sum of rembg + analyze + upload (etc.) after a successful save. */
  logPipelineBaseline(pipelineWorkflow = `${this.workflow}_pipeline`) {
    const totalMs = this.pipelineTotalMs();
    if (totalMs <= 0) return;
    logPerfBaseline({
      workflow: pipelineWorkflow,
      totalMs,
      stages: { ...this.stages },
      traceId: this.traceId,
      meta: {
        ...this.meta,
        note: "sum_of_stages_excludes_user_idle",
      },
    });
  }
}
