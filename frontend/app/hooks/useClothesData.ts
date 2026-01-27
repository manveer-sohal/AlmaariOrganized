import { useUser } from "@auth0/nextjs-auth0/client";
import { useInfiniteQuery } from "@tanstack/react-query";

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
      const response = await fetch(`/api/clothes/listClothes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth0Id: user?.sub,
          page: pageParam,
          numberOfClothes,
        }),
      });
      if (!response.ok) throw new Error("Failed to fetch clothes data");
      const data = await response.json();
      console.log("data", data.Clothes);
      return data.Clothes;
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === numberOfClothes ? allPages.length + 1 : undefined,
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
