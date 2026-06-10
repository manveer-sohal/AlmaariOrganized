import { useUser } from "@auth0/nextjs-auth0/client";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ClothingItem } from "../types/clothes";

export function useDeleteClothing(clothingId: string) {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/clothes/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth0Id: user?.sub,
          uniqueId: clothingId,
        }),
      });

      if (!res.ok) throw new Error("Failed to delete clothing");
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["clothesData"] });

      const previousQueries = queryClient.getQueriesData({
        queryKey: ["clothesData"],
      });

      queryClient.setQueriesData(
        { queryKey: ["clothesData"] },
        (old: InfiniteData<ClothingItem[]> | undefined) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page) =>
              page.filter((item) => item._id !== clothingId),
            ),
          };
        },
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outfits"] });
    },
  });
}
