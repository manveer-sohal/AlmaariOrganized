import { useMutation } from "@tanstack/react-query";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";
import { StylistMode } from "../types/aiStylist";

type SubmitFeedbackInput = {
  recommendationId: string;
  outfitItemIds: string[];
  rating: "positive" | "negative";
  occasion?: string;
  style?: string;
  label?: string;
  outfitSignature?: string;
  reasons?: string[];
  generationId?: string;
  mode?: StylistMode;
};

export const useStylistFeedback = () => {
  return useMutation({
    mutationFn: async (payload: SubmitFeedbackInput) => {
      const outfitSignature =
        payload.outfitSignature ||
        [...payload.outfitItemIds].map(String).sort().join("|");

      const postFeedback = async () =>
        fetch("/api/ai-stylist/feedback", {
          method: "POST",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ ...payload, outfitSignature }),
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
