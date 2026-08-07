import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import {
  StylistRecommendationRequest,
  StylistRecommendationResponse,
} from "../types/aiStylist";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";
import { createClientTraceId } from "../utils/aiAnalyzeTiming";
import { logPerfBaseline } from "../utils/workflowTiming";

export const useStylistRecommendations = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const requestIdRef = useRef(0);

  const mutation = useMutation({
    mutationFn: async (payload: StylistRecommendationRequest) => {
      if (!user?.sub) {
        throw new Error("You must be logged in to generate outfits.");
      }

      const currentRequestId = ++requestIdRef.current;
      const traceId = createClientTraceId();
      const clientStart = performance.now();

      const postRecommendations = async () =>
        fetch("/api/ai-stylist/recommendations", {
          method: "POST",
          headers: await getAuthHeaders({
            "Content-Type": "application/json",
            "X-Request-Id": traceId,
          }),
          body: JSON.stringify(payload),
        });

      let response = await postRecommendations();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await postRecommendations();
      }

      const data = (await response.json()) as StylistRecommendationResponse;
      const clientTotalMs = performance.now() - clientStart;

      if (currentRequestId !== requestIdRef.current) {
        throw new Error("STALE_REQUEST");
      }

      if (!response.ok || !data.success) {
        const error = new Error(
          data.message || "Failed to generate outfit recommendations",
        ) as Error & {
          code?: string;
          creditBalance?: number;
          status?: number;
        };
        error.code = data.code;
        error.creditBalance = data.creditBalance;
        error.status = response.status;
        throw error;
      }

      logPerfBaseline({
        workflow: "outfit_recommendation_client",
        totalMs: clientTotalMs,
        stages: {
          clientRoundTripMs: clientTotalMs,
          ...(typeof data.timing?.totalMs === "number"
            ? { serverTotalMs: data.timing.totalMs }
            : {}),
        },
        traceId,
        meta: {
          generationId: data.generationId,
          mode: data.mode,
          recommendationCount: data.recommendations?.length,
        },
      });

      return { data, requestId: currentRequestId };
    },
    onSuccess: (result) => {
      if (result.requestId !== requestIdRef.current) return;
      if (result.data.creditBalance != null && user?.sub) {
        queryClient.setQueryData(["user", user.sub], (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return { ...old, creditBalance: result.data.creditBalance };
        });
      }
    },
  });

  const cancelPending = () => {
    requestIdRef.current += 1;
  };

  return { ...mutation, cancelPending };
};
