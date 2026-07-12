import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { EnrichmentStatus } from "../types/clothes";

const TERMINAL: EnrichmentStatus[] = ["completed", "failed"];

/**
 * Limited list refetch while style enrichment is in flight.
 * Stops on completed/failed. Does not trigger enrichment jobs.
 */
export function useClothingEnrichmentPoll(
  enrichmentStatus?: EnrichmentStatus | null,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    if (!enrichmentStatus) return;
    if (TERMINAL.includes(enrichmentStatus)) {
      attemptsRef.current = 0;
      return;
    }
    if (enrichmentStatus !== "pending" && enrichmentStatus !== "processing") {
      return;
    }

    attemptsRef.current = 0;
    const timer = setInterval(() => {
      attemptsRef.current += 1;
      queryClient.invalidateQueries({ queryKey: ["clothesData"] });
      if (attemptsRef.current >= 8) {
        clearInterval(timer);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [enrichmentStatus, enabled, queryClient]);
}
