import { useQuery } from "@tanstack/react-query";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

type FeedbackItem = {
  _id: string;
  email: string;
  type: string;
  subject: string;
  message: string;
  priority: string;
  createdAt: string;
};

export const useFeedback = (
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: string,
  type: string,
  priority: string,
  enabled = true,
) => {
  const { data, isLoading, error } = useQuery<{
    feedback: FeedbackItem[];
    total: number;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: string;
  }>({
    queryKey: ["feedback", page, limit, sortBy, sortOrder, type, priority],
    enabled,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
        type,
        priority,
      });

      const fetchFeedback = async () =>
        fetch(`/api/feedback/getPaginatedFeedback?${params}`, {
          headers: await getAuthHeaders(),
        });

      let res = await fetchFeedback();
      if (res.status === 401) {
        clearAuthTokenCache();
        res = await fetchFeedback();
      }

      if (!res.ok) throw new Error("Failed to load feedback");
      return res.json();
    },
  });
  return { data, isLoading, error };
};
