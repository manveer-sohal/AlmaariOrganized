const WARMUP_COOLDOWN_MS = 60_000;
let lastWarmupAt = 0;
let warmupInFlight: Promise<void> | null = null;

/**
 * Background warm-up for the AI microservice (no credits, no OpenAI analysis).
 * Debounced to at most once per minute per browser session.
 */
export const warmupAiClothingService = (): void => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastWarmupAt < WARMUP_COOLDOWN_MS) return;
  if (warmupInFlight) return;

  lastWarmupAt = now;
  warmupInFlight = fetch("/api/ai/warmup", { method: "GET" })
    .then(() => undefined)
    .catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[AI warmup] non-fatal:", err);
      }
    })
    .finally(() => {
      warmupInFlight = null;
    });
};
