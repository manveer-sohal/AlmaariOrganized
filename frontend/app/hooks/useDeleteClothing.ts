import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ClothingItem } from "../types/clothes";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

export function useDeleteClothing(clothingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const deleteClothing = async () =>
        fetch("/api/clothes/remove", {
          method: "POST",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ uniqueId: clothingId }),
        });

      let res = await deleteClothing();
      if (res.status === 401) {
        clearAuthTokenCache();
        res = await deleteClothing();
      }

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
