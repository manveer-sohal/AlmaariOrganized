import { useUser } from "@auth0/nextjs-auth0/client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ClothingItem } from "../types/clothes";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";
import { normalizeClothingItem } from "../utils/validateClothingMetadata";

export const useClothesData = (numberOfClothes: number = 40) => {
  const { user } = useUser();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["clothesData", user?.sub, numberOfClothes],
    enabled: !!user,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const fetchClothes = async () =>
        fetch(`/api/clothes/listClothes`, {
          method: "POST",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            page: pageParam,
            numberOfClothes,
          }),
        });

      let response = await fetchClothes();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await fetchClothes();
      }

      if (!response.ok) throw new Error("Failed to fetch clothes data");
      const payload = await response.json();
      const rows = Array.isArray(payload.Clothes) ? payload.Clothes : [];
      return rows.map((item: Record<string, unknown>) =>
        normalizeClothingItem(item),
      ) as ClothingItem[];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === numberOfClothes ? allPages.length + 1 : undefined,

    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const clothes = data?.pages.flat() ?? [];

  return {
    clothes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoadingClothes: isLoading,
    error,
  };
};
