import { useMemo, useRef, useState, useEffect, type ReactNode } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, ChevronDown, ChevronUp, Shirt } from "lucide-react";
import { useOnboarding } from "../../hooks/useOnboarding";
import { useClothesData } from "../../hooks/useClothesData";
import { startOnboardingTourOutfit } from "../../components/OnBoardingTourOutfit";
import {
  isOnboardingTourRunning,
  startOnboardingTour,
} from "../../components/OnBoardingTour";
import { markOnboardingTourSeen } from "../../utils/markOnboardingTourSeen";
import { AnimatePresence, motion } from "framer-motion";

type CheckListProps = {
  /** Sidebar: always open, styled for desktop nav. Floating: mobile overlay. */
  variant?: "floating" | "sidebar";
};

type Step = {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  onGo: () => void;
};

function CheckList({ variant = "floating" }: CheckListProps) {
  const { user: authUser } = useUser();
  const queryClient = useQueryClient();
  const { onboarding, isLoadingOnboarding } = useOnboarding();
  const { clothes, isLoadingClothes } = useClothesData(1);
  const [active, setActive] = useState(true);
  const hasTriggeredAutoTourRef = useRef(false);
  const isSidebar = variant === "sidebar";

  const startOnboardingOutfit = useMemo(() => {
    return () => {
      startOnboardingTourOutfit();
    };
  }, []);

  const startOnboardingClothesManual = useMemo(() => {
    return () => {
      startOnboardingTour();
    };
  }, []);

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

    if (!shouldAutoStartTour) {
      return;
    }

    hasTriggeredAutoTourRef.current = true;
    startOnboardingTour();

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
  ]);

  const steps: Step[] = [];
  if (!onboarding?.hasCompletedOnboardingForClothes) {
    steps.push({
      id: "clothes",
      label: "Add your first item",
      description: "Upload a photo to start your wardrobe",
      icon: <Camera className="h-4 w-4" aria-hidden />,
      onGo: () => {
        if (!isSidebar) setActive(false);
        startOnboardingClothesManual();
      },
    });
  }
  if (!onboarding?.hasCompletedOnboardingForOutfits) {
    steps.push({
      id: "outfit",
      label: "Create an outfit",
      description: "Build a look from your clothes",
      icon: <Shirt className="h-4 w-4" aria-hidden />,
      onGo: () => {
        if (!isSidebar) setActive(false);
        startOnboardingOutfit();
      },
    });
  }

  if (isLoadingOnboarding || steps.length === 0) {
    return null;
  }

  const totalSteps = 2;
  const completedCount = totalSteps - steps.length;
  const progressPct = (completedCount / totalSteps) * 100;

  const stepList = (
    <ul className={`flex w-full flex-col ${isSidebar ? "gap-2" : "gap-2"}`}>
      {steps.map((step, index) => (
        <li key={step.id}>
          <div
            className={`flex items-start gap-2.5 rounded-xl border border-indigo-200/80 bg-white/70 p-2.5 text-left shadow-sm ${
              isSidebar ? "" : "bg-white/80"
            }`}
          >
            <span
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-sm"
              aria-hidden
            >
              {step.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                Step {completedCount + index + 1}
              </p>
              <p
                className={`font-semibold leading-snug text-indigo-950 ${
                  isSidebar ? "text-sm" : "text-xs"
                }`}
              >
                {step.label}
              </p>
              {isSidebar ? (
                <p className="mt-0.5 text-xs leading-snug text-indigo-800/70">
                  {step.description}
                </p>
              ) : null}
              <button
                type="button"
                onClick={step.onGo}
                disabled={isLoadingOnboarding}
                className={`mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSidebar ? "h-8" : "h-7"
                }`}
              >
                Start
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  if (isSidebar) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-3 w-full overflow-hidden rounded-2xl border border-indigo-300/70 bg-gradient-to-b from-white/75 to-indigo-50/60 p-3 text-left shadow-md backdrop-blur"
      >
        <div className="mb-2.5 flex items-start justify-between gap-2 px-0.5">
          <div>
            <p className="text-sm font-semibold text-indigo-950">
              Getting started
            </p>
            <p className="text-xs text-indigo-800/70">
              {completedCount === 0
                ? "Two quick steps to begin"
                : "One step left"}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-800">
            {completedCount}/{totalSteps}
          </span>
        </div>

        <div
          className="mb-3 h-1.5 overflow-hidden rounded-full bg-indigo-200/70"
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-label="Onboarding progress"
        >
          <div
            className="h-full rounded-full bg-indigo-500 transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {stepList}
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {active ? (
          <div className="relative mx-auto w-[min(100vw-2rem,16.5rem)] overflow-hidden rounded-2xl border border-indigo-200 bg-white/85 p-3 shadow-lg backdrop-blur">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-indigo-950">
                  Getting started
                </p>
                <p className="text-[11px] text-indigo-800/70">
                  {completedCount}/{totalSteps} complete
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
                onClick={() => setActive(false)}
                aria-label="Collapse checklist"
              >
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div
              className="mb-2.5 h-1 overflow-hidden rounded-full bg-indigo-100"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={totalSteps}
            >
              <div
                className="h-full rounded-full bg-indigo-500 transition-[width] duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {stepList}
          </div>
        ) : (
          <button
            type="button"
            className="mx-auto flex items-center gap-2 rounded-xl border border-indigo-200 bg-white/90 px-3 py-2 text-sm font-semibold text-indigo-900 shadow-md backdrop-blur transition-colors hover:bg-indigo-500 hover:text-white"
            onClick={() => setActive(true)}
            aria-label="Expand checklist"
          >
            <ChevronUp className="h-4 w-4" aria-hidden />
            Getting started
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default CheckList;
