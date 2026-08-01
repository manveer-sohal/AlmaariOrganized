import { useQuery } from "@tanstack/react-query";
import { useUser as useUserAuth0 } from "@auth0/nextjs-auth0/client";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

export const useUserData = () => {
  const { user: userAuth0 } = useUserAuth0();
  const { data: user, isPending, isError } = useQuery({
    queryKey: ["user", userAuth0?.sub],
    queryFn: async () => {
      const fetchUserData = async () =>
        fetch(`/api/users/data`, {
          method: "POST",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({}),
        });

      let response = await fetchUserData();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await fetchUserData();
      }

      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
    enabled: !!userAuth0?.sub,
  });
  return { user, isLoading: isPending, isError };
};
