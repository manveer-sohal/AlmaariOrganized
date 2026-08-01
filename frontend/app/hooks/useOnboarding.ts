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
          hasCompletedProfileOnboarding: Boolean(
            user.hasCompletedProfileOnboarding,
          ),
          stylePreferences: user.stylePreferences ?? [],
          seasonalColorPalette: user.seasonalColorPalette ?? null,
          favoriteBrands: user.favoriteBrands ?? [],
        }
      : undefined,
    isLoadingOnboarding: isLoading,
  };
};
