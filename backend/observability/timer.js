import { performance } from "node:perf_hooks";

export const createTimer = () => {
  const start = performance.now();
  return {
    start,
    elapsedMs: () => Math.round((performance.now() - start) * 100) / 100,
    measure: async (fn) => {
      const t0 = performance.now();
      try {
        return await fn();
      } finally {
        // caller reads via outer timer or nested
        void t0;
      }
    },
  };
};

export const measureAsync = async (fn) => {
  const start = performance.now();
  try {
    const result = await fn();
    return {
      result,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      ok: true,
    };
  } catch (error) {
    return {
      error,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      ok: false,
    };
  }
};
