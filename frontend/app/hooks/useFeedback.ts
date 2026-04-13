import { useQuery } from "@tanstack/react-query";

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
    queryFn: async () => {
      const res = await fetch(
        `/api/feedback/getPaginatedFeedback?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}&type=${type}&priority=${priority}`,
      );
      if (!res.ok) throw new Error("Failed to load feedback");
      return res.json();
    },
  });
  return { data, isLoading, error };
};
