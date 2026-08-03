import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ClothingItem } from "../types/clothes";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

function removeClothingFromCache(
  old: InfiniteData<ClothingItem[]> | undefined,
  clothingId: string,
) {
  if (!old?.pages) return old;

  const targetId = String(clothingId);
  return {
    ...old,
    pages: old.pages.map((page) =>
      page.filter((item) => String(item._id) !== targetId),
    ),
  };
}

export function useDeleteClothing(clothingId: string) {
  const { user } = useUser();
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
        (old: InfiniteData<ClothingItem[]> | undefined) =>
          removeClothingFromCache(old, clothingId),
      );

      return { previousQueries };
    },
    onError: (_err, _vars, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSuccess: () => {
      queryClient.setQueriesData(
        { queryKey: ["clothesData"] },
        (old: InfiniteData<ClothingItem[]> | undefined) =>
          removeClothingFromCache(old, clothingId),
      );

      // Home uses a separate page-size query and unmounts while details are open.
      // refetchType "all" refreshes inactive caches (e.g. Recent on home).
      void queryClient.invalidateQueries({
        queryKey: ["clothesData"],
        refetchType: "all",
      });
      void queryClient.invalidateQueries({
        queryKey: ["outfits", user?.sub],
      });
    },
  });
}
