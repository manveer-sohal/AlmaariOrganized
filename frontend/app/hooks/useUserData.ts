import { useQuery } from "@tanstack/react-query";
import { useUser as useUserAuth0 } from "@auth0/nextjs-auth0/client";

export const useUserData = () => {
  const { user: userAuth0 } = useUserAuth0();
  const { data: user } = useQuery({
    queryKey: ["user", userAuth0?.sub],
    queryFn: async () => {
      const response = await fetch(`/api/users/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0Id: userAuth0?.sub }),
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      return data;
    },
    enabled: !!userAuth0?.sub,
  });
  return { user };
};
