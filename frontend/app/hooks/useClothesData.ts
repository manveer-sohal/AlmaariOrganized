import { useUser } from "@auth0/nextjs-auth0/client";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { ClothingItem } from "../types/clothes";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";
import {
  isImageProcessingStatus,
  isPlaceholderImageSrc,
} from "../utils/resolveClothingDisplaySrc";
import { normalizeClothingItem } from "../utils/validateClothingMetadata";

/** Canonical wardrobe page size — shared by home, wardrobe, and outfit builder. */
export const WARDROBE_PAGE_SIZE = 40;
/** Alias for shared constant naming in architecture docs. */
export const CLOTHES_PAGE_SIZE = WARDROBE_PAGE_SIZE;
/** Onboarding only needs existence / count signal — keep a tiny page. */
export const ONBOARDING_CLOTHES_PAGE_SIZE = 1;

/** Start loading the next page before the sentinel enters the viewport. */
export const WARDROBE_IN_VIEW_OPTIONS = {
  rootMargin: "800px 0px",
} as const;

export const clothesQueryKeys = {
  all: ["clothesData"] as const,
  list: (sub: string | null | undefined, pageSize: number) =>
    ["clothesData", sub ?? undefined, pageSize] as const,
};

const hasProcessingItems = (pages?: ClothingItem[][]) =>
  (pages ?? []).some((page) =>
    page.some((item) => isImageProcessingStatus(item.processingStatus)),
  );

/** Keep client crop previews while the list API still returns placeholders. */
const preserveProcessingPreviews = (
  fresh: ClothingItem[],
  previousPages?: ClothingItem[][],
): ClothingItem[] => {
  if (!previousPages?.length) return fresh;
  const prevById = new Map(
    previousPages.flat().map((item) => [item._id, item] as const),
  );
  return fresh.map((item) => {
    if (
      !isImageProcessingStatus(item.processingStatus) ||
      !isPlaceholderImageSrc(item.imageSrc)
    ) {
      return item;
    }
    const prev = prevById.get(item._id);
    if (prev?.imageSrc && !isPlaceholderImageSrc(prev.imageSrc)) {
      return { ...item, imageSrc: prev.imageSrc };
    }
    return item;
  });
};

export const useClothesData = (numberOfClothes: number = WARDROBE_PAGE_SIZE) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const queryKey = clothesQueryKeys.list(user?.sub, numberOfClothes);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey,
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
      const normalized = rows.map((item: Record<string, unknown>) =>
        normalizeClothingItem(item),
      ) as ClothingItem[];

      if (pageParam !== 1) return normalized;

      const previous = queryClient.getQueryData<InfiniteData<ClothingItem[]>>(
        queryKey,
      );
      return preserveProcessingPreviews(normalized, previous?.pages);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === numberOfClothes ? allPages.length + 1 : undefined,

    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // After S3 upload, list returns crop_pending + placeholder until the
    // pipeline writes CDN URLs (~1s). Poll until every item is ready.
    refetchInterval: (query) =>
      hasProcessingItems(query.state.data?.pages) ? 2000 : false,
  });

  const clothes = data?.pages.flat() ?? [];

  return {
    clothes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoadingClothes: isPending || (isFetching && clothes.length === 0),
    error,
  };
};
