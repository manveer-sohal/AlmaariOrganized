"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQueryClient } from "@tanstack/react-query";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useClothesData } from "../../hooks/useClothesData";
import {
  isOnboardingTourRunning,
  startOnboardingTour,
} from "../../components/OnBoardingTour";
import { markOnboardingTourSeen } from "../../utils/markOnboardingTourSeen";
import { View } from "../../types/clothes";

/** Starts the wardrobe add-clothes tour once for new empty accounts. */
export default function OnboardingTourBootstrap({
  setView,
}: {
  setView: (view: View) => void;
}) {
  const { user: authUser } = useUser();
  const queryClient = useQueryClient();
  const { onboarding, isLoadingOnboarding } = useOnboarding();
  const { clothes, isLoadingClothes } = useClothesData(1);
  const hasTriggeredAutoTourRef = useRef(false);

  useEffect(() => {
    const clothingCount = clothes.length;
    const shouldAutoStartTour =
      !!authUser &&
      !isLoadingOnboarding &&
      !isLoadingClothes &&
      !onboarding?.onboardingTourSeenAt &&
      clothingCount === 0 &&
      !isOnboardingTourRunning() &&
      !hasTriggeredAutoTourRef.current;

    if (!shouldAutoStartTour) return;

    hasTriggeredAutoTourRef.current = true;
    setView("wardrobe");
    // Allow wardrobe header (add button) to mount before driver.js targets it.
    window.setTimeout(() => {
      startOnboardingTour();
    }, 120);

    markOnboardingTourSeen()
      .then((seenAt) => {
        if (!authUser?.sub) return;
        queryClient.setQueryData(["user", authUser.sub], (current: unknown) => {
          if (!current || typeof current !== "object") return current;
          return { ...current, onboardingTourSeenAt: seenAt };
        });
      })
      .catch((error) => {
        console.error("Failed to persist onboarding tour seen state:", error);
      });
  }, [
    authUser,
    isLoadingOnboarding,
    isLoadingClothes,
    onboarding?.onboardingTourSeenAt,
    clothes.length,
    queryClient,
    setView,
  ]);

  return null;
}
