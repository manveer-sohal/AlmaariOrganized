import { useUserData } from "./useUserData";
//hook to get the onboarding status of the user

export const useOnboarding = () => {
  const { user } = useUserData();
  return {
    onboarding: user?.hasCompletedOnboardingForClothes,
    isLoadingOnboarding: user?.isLoadingOnboarding,
  };
};
