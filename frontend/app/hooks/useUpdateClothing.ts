import { useUser } from "@auth0/nextjs-auth0/client";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ClothingItem, Outfit } from "../types/clothes";
import {
  ClothingMetadataDraft,
  normalizeClothingItem,
} from "../utils/validateClothingMetadata";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

type UpdateClothingPayload = ClothingMetadataDraft & {
  uniqueId: string;
};

export function useUpdateClothing() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateClothingPayload) => {
      const updateClothing = async () =>
        fetch("/api/clothes/update", {
          method: "POST",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            uniqueId: payload.uniqueId,
            type: payload.type,
            colour: payload.colour,
            material: payload.material,
            fit: payload.fit,
            pattern: payload.pattern,
            slot: payload.slot,
          }),
        });

      let response = await updateClothing();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await updateClothing();
      }

      const data = await response.json();
      if (!response.ok) {
        const detailMessage = Array.isArray(data.details)
          ? data.details.join(", ")
          : data.details;
        throw new Error(detailMessage || data.error || "Failed to update item");
      }

      return normalizeClothingItem(data.clothing);
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueriesData(
        { queryKey: ["clothesData"] },
        (old: InfiniteData<ClothingItem[]> | undefined) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item._id === updatedItem._id ? { ...item, ...updatedItem } : item,
              ),
            ),
          };
        },
      );

      queryClient.setQueryData(
        ["outfits", user?.sub],
        (old: Outfit[] | undefined) => {
          if (!old) return old;
          return old.map((outfit) => ({
            ...outfit,
            outfit_items: outfit.outfit_items.map((item) =>
              item._id === updatedItem._id ? { ...item, ...updatedItem } : item,
            ),
          }));
        },
      );
    },
  });
}
