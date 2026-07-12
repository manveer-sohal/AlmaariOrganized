import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { EnrichmentStatus } from "../types/clothes";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

async function requestStyleEnrichment(clothingId: string) {
  const post = async () =>
    fetch(`/api/clothes/${clothingId}/style-enrichment/retry`, {
      method: "POST",
      headers: await getAuthHeaders({ "Content-Type": "application/json" }),
    });

  let response = await post();
  if (response.status === 401) {
    clearAuthTokenCache();
    response = await post();
  }
  return response;
}

/**
 * While style enrichment is in flight:
 * - kick off a backend job once for pending/failed items (list poll alone never starts work)
 * - refetch the wardrobe list until completed/failed
 */
export function useClothingEnrichmentPoll(
  clothingId: string | undefined,
  enrichmentStatus?: EnrichmentStatus | null,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const attemptsRef = useRef(0);
  const ensureAttemptedForId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !clothingId) return;
    if (!enrichmentStatus) return;
    if (enrichmentStatus === "completed") {
      attemptsRef.current = 0;
      ensureAttemptedForId.current = null;
      return;
    }
    if (
      enrichmentStatus !== "pending" &&
      enrichmentStatus !== "processing" &&
      enrichmentStatus !== "failed"
    ) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const startPolling = () => {
      attemptsRef.current = 0;
      timer = setInterval(() => {
        attemptsRef.current += 1;
        queryClient.invalidateQueries({ queryKey: ["clothesData"] });
        if (attemptsRef.current >= 12) {
          clearInterval(timer);
        }
      }, 4000);
    };

    const run = async () => {
      // Pending/failed items need an explicit job; processing is already in flight.
      const shouldEnsure =
        enrichmentStatus === "pending" || enrichmentStatus === "failed";

      if (
        shouldEnsure &&
        ensureAttemptedForId.current !== `${clothingId}:${enrichmentStatus}`
      ) {
        ensureAttemptedForId.current = `${clothingId}:${enrichmentStatus}`;
        try {
          const response = await requestStyleEnrichment(clothingId);
          // 202 scheduled; 409 in-progress/completed; 429 cooldown — all OK to poll
          if (
            !cancelled &&
            (response.ok ||
              response.status === 202 ||
              response.status === 409 ||
              response.status === 429)
          ) {
            queryClient.invalidateQueries({ queryKey: ["clothesData"] });
          }
        } catch {
          // Still poll; a later open can retry.
        }
      }

      if (!cancelled) startPolling();
    };

    void run();

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [clothingId, enrichmentStatus, enabled, queryClient]);
}
