import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnalyzeClothingResponse } from "../types/clothingAnalysis";
import {
  isAiAnalyzeTimingEnabled,
  logAnalyzeStep,
} from "../utils/aiAnalyzeTiming";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

type AnalyzeClothingInput = {
  image: string;
  requestId?: string;
};

export const useAnalyzeClothing = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ image, requestId }: AnalyzeClothingInput) => {
      if (!user?.sub) {
        throw new Error("You must be logged in to analyze images.");
      }

      const traceId = requestId ?? "unknown";
      const fetchStart = performance.now();

      const postAnalyze = async () =>
        fetch("/api/ai/analyze-clothing", {
          method: "POST",
          headers: await getAuthHeaders({
            "Content-Type": "application/json",
            ...(requestId ? { "X-Request-Id": requestId } : {}),
          }),
          body: JSON.stringify({ image }),
        });

      let response = await postAnalyze();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await postAnalyze();
      }

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
    onSuccess: (data) => {
      if (data.creditBalance != null && user?.sub) {
        queryClient.setQueryData(["user", user.sub], (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          return {
            ...old,
            creditBalance: data.creditBalance,
          };
        });
      }
      if (user?.sub) {
        queryClient.invalidateQueries({ queryKey: ["user", user.sub] });
      }
    },
  });
};
