import { useUser } from "@auth0/nextjs-auth0/client";
import { useQuery } from "@tanstack/react-query";
import { Outfit } from "../types/clothes";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

export function useOutfits() {
  const { user } = useUser();

  return useQuery({
    queryKey: ["outfits", user?.sub],
    queryFn: async () => {
      const fetchOutfits = async () =>
        fetch(`/api/clothes/getOutfits`, {
          method: "POST",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({}),
        });

      let response = await fetchOutfits();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await fetchOutfits();
      }

      if (!response.ok) throw new Error("Failed to fetch outfits");
      const data = await response.json();
      const raw = Array.isArray(data) ? data : (data.outfits ?? []);
      if (!Array.isArray(raw)) {
        return [];
      }
      return [...raw].reverse() as Outfit[];
    },
    enabled: !!user,
  });
}
