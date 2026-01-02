import { useUser } from "@auth0/nextjs-auth0/client";
import { useQuery } from "@tanstack/react-query";
//hook to get the onboarding status of the user

export const useOnboarding = () => {
  const { user } = useUser();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const { data: onboarding, isLoading: isLoadingOnboarding } = useQuery({
    queryKey: ["onboarding"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/users/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auth0Id: user?.sub }),
      });
      if (!response.ok) throw new Error("Failed to fetch onboarding");
      const data = await response.json();
      return data;
    },
    enabled: !!user,
  });
  return { onboarding, isLoadingOnboarding };
};
