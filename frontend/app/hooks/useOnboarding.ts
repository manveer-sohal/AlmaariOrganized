import { useUserData } from "./useUserData";

export const useOnboarding = () => {
  const { user, isLoading } = useUserData();
  return {
    onboarding: user
      ? {
          hasCompletedOnboardingForClothes:
            user.hasCompletedOnboardingForClothes,
          hasCompletedOnboardingForOutfits:
            user.hasCompletedOnboardingForOutfits,
          onboardingTourSeenAt: user.onboardingTourSeenAt ?? null,
        }
      : undefined,
    isLoadingOnboarding: isLoading,
  };
};
