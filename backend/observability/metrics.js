const store = {
  counters: Object.create(null),
  timings: Object.create(null),
};

export const incMetric = (name, by = 1) => {
  store.counters[name] = (store.counters[name] || 0) + by;
};

export const observeMs = (name, durationMs) => {
  if (typeof durationMs !== "number" || Number.isNaN(durationMs)) return;
  if (!store.timings[name]) {
    store.timings[name] = { count: 0, sumMs: 0, minMs: durationMs, maxMs: durationMs };
  }
  const bucket = store.timings[name];
  bucket.count += 1;
  bucket.sumMs += durationMs;
  bucket.minMs = Math.min(bucket.minMs, durationMs);
  bucket.maxMs = Math.max(bucket.maxMs, durationMs);
};

export const getMetricsSnapshot = () => {
  const timings = {};
  for (const [name, bucket] of Object.entries(store.timings)) {
    timings[name] = {
      count: bucket.count,
      sumMs: Math.round(bucket.sumMs * 100) / 100,
      avgMs:
        bucket.count > 0
          ? Math.round((bucket.sumMs / bucket.count) * 100) / 100
          : 0,
      minMs: Math.round(bucket.minMs * 100) / 100,
      maxMs: Math.round(bucket.maxMs * 100) / 100,
    };
  }
  return {
    counters: { ...store.counters },
    timings,
  };
};

/** Test helper */
export const resetMetrics = () => {
  store.counters = Object.create(null);
  store.timings = Object.create(null);
};
