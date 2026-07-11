import { useMutation } from "@tanstack/react-query";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

type SubmitFeedbackInput = {
  recommendationId: string;
  outfitItemIds: string[];
  rating: "positive" | "negative";
  occasion?: string;
  style?: string;
};

export const useStylistFeedback = () => {
  return useMutation({
    mutationFn: async (payload: SubmitFeedbackInput) => {
      const postFeedback = async () =>
        fetch("/api/ai-stylist/feedback", {
          method: "POST",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });

      let response = await postFeedback();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await postFeedback();
      }

      if (!response.ok) {
        throw new Error("Failed to submit stylist feedback");
      }
    },
  });
};
