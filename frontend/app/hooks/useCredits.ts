import { useUserData } from "./useUserData";

export const useCredits = () => {
  const { user } = useUserData();

  return {
    credits: user?.creditBalance,
    isLoadingCredits: user?.isLoadingCredits,
  };
};
