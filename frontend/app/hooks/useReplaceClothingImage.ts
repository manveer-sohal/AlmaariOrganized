import { useUser } from "@auth0/nextjs-auth0/client";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ClothingItem, Outfit } from "../types/clothes";
import { normalizeClothingItem } from "../utils/validateClothingMetadata";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

type ReplaceClothingImagePayload = {
  uniqueId: string;
  image: Blob;
};

export function useReplaceClothingImage() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uniqueId, image }: ReplaceClothingImagePayload) => {
      const formData = new FormData();
      formData.append("uniqueId", uniqueId);
      formData.append("image", image, "cropped.png");
      formData.append("imageAlreadyCropped", "true");

      const replaceImage = async () =>
        fetch("/api/clothes/replace-image", {
          method: "POST",
          headers: await getAuthHeaders(),
          body: formData,
        });

      let response = await replaceImage();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await replaceImage();
      }

      const data = await response.json();
      if (!response.ok) {
        const detailMessage = Array.isArray(data.details)
          ? data.details.join(", ")
          : data.details;
        throw new Error(
          detailMessage || data.error || "Failed to update image",
        );
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
