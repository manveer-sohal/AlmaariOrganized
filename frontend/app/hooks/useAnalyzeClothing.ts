import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnalyzeClothingResponse } from "../types/clothingAnalysis";
import {
  isAiAnalyzeTimingEnabled,
  logAnalyzeStep,
} from "../utils/aiAnalyzeTiming";

type AnalyzeClothingInput = {
  image: string;
  auth0Id: string;
  requestId?: string;
};

export const useAnalyzeClothing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ image, auth0Id, requestId }: AnalyzeClothingInput) => {
      if (!auth0Id) {
        throw new Error("You must be logged in to analyze images.");
      }

      const traceId = requestId ?? "unknown";
      const fetchStart = performance.now();

      const response = await fetch("/api/ai/analyze-clothing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(requestId ? { "X-Request-Id": requestId } : {}),
        },
        body: JSON.stringify({
          auth0Id,
          image,
        }),
      });

      if (isAiAnalyzeTimingEnabled()) {
        logAnalyzeStep(
          traceId,
          "fetch /api/ai/analyze-clothing (TTFB → full body)",
          performance.now() - fetchStart,
        );
      }

      const parseStart = performance.now();
      const data: AnalyzeClothingResponse = await response.json();

      if (isAiAnalyzeTimingEnabled()) {
        logAnalyzeStep(traceId, "JSON parse response", performance.now() - parseStart);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to analyze clothing image");
      }

      return data;
    },
    onSuccess: (data, variables) => {
      if (data.creditBalance != null && variables.auth0Id) {
        queryClient.setQueryData(["user", variables.auth0Id], (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return {
            ...old,
            creditBalance: data.creditBalance,
          };
        });
      }
      queryClient.invalidateQueries({ queryKey: ["user", variables.auth0Id] });
    },
  });
};
