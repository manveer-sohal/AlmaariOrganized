import { useUserData } from "./useUserData";

export const useCredits = () => {
  const { user, isLoading } = useUserData();

  return {
    credits: user?.creditBalance,
    isLoadingCredits: isLoading,
  };
};
