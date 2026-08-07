import { clearAuthTokenCache, getAuthHeaders } from "./getAuthHeaders";

const WARMUP_COOLDOWN_MS = 60_000;
let lastWarmupAt = 0;
let warmupInFlight: Promise<void> | null = null;

/**
 * Authenticated warm-up for crop (rembg) + analysis process wake.
 * Debounced; no-op when called without a session (callers must wait for Auth0).
 * Analysis /warmup does not warm the OpenAI model — only the service process.
 */
export const warmupAiClothingService = (): void => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (now - lastWarmupAt < WARMUP_COOLDOWN_MS) return;
  if (warmupInFlight) return;

  lastWarmupAt = now;
  warmupInFlight = (async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;
      const response = await fetch("/api/ai/warmup", {
        method: "GET",
        headers,
        cache: "no-store",
      });
      if (response.status === 401) {
        clearAuthTokenCache();
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[AI warmup] non-fatal:", err);
      }
    } finally {
      warmupInFlight = null;
    }
  })();
};
