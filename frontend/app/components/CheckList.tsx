import { useMemo, useState } from "react";
import { useOnboarding } from "../hooks/useOnboarding";
import { startOnboardingTourOutfit } from "./OnBoardingTourOutfit";
import { startOnboardingTour } from "./OnBoardingTour";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
function CheckList() {
  const { onboarding, isLoadingOnboarding } = useOnboarding();
  const [active, setActive] = useState(true);

  const startOnboardingOutfit = useMemo(() => {
    return () => {
      startOnboardingTourOutfit();
    };
  }, []);

  const startOnboardingClothes = useMemo(() => {
    return () => {
      startOnboardingTour();
    };
  }, []);

  useEffect(() => {
    if (!isLoadingOnboarding) {
      if (onboarding?.hasCompletedOnboardingForClothes == false) {
        startOnboardingClothes();
      } else if (
        onboarding?.hasCompletedOnboardingForOutfits == true &&
        onboarding?.hasCompletedOnboardingForClothes == true
      ) {
        setActive(false);
      }
      // startOnboardingClothes();
    }
  }, [
    onboarding?.hasCompletedOnboardingForClothes,
    startOnboardingClothes,
    isLoadingOnboarding,
    onboarding,
  ]);

  if (isLoadingOnboarding || isLoadingOnboarding == undefined) {
    return <div></div>;
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {active ? (
            <div className="bg-white/40 backdrop-blur border border-indigo-200 rounded-xl md:max-w-full max-w-[200px] mx-auto p-6 shadow-md text-base flex flex-col h-42 md:h-32">
              <button
                className="bg-indigo-100/70 text-indigo-900 w-6 h-6 md:w-8 md:h-8 p-1 md:p-2 cursor-pointer flex rounded-md absolute top-0 justify-end right-0 md:justify-start md:left-0"
                onClick={() => {
                  setActive((prev) => !prev);
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div className="flex justify-between items-center">
                <ul>
                  <div className="flex items-center justify-between gap-2">
                    <li
                      className={` list-disc text-xs md:text-base ${
                        onboarding?.hasCompletedOnboardingForClothes
                          ? "text-green-500"
                          : "text-indigo-900"
                      } ${
                        onboarding?.hasCompletedOnboardingForClothes
                          ? "line-through"
                          : ""
                      }`}
                    >
                      Add a picture of your first item
                    </li>
                    <button
                      onClick={() => {
                        setActive(false);
                        startOnboardingClothes();
                      }}
                      className={`inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300 ${
                        onboarding?.hasCompletedOnboardingForClothes
                          ? "opacity-50 cursor-not-allowed text-green-300 border-green-300 bg-green-100/70"
                          : ""
                      } text-xs h-8 md:text-base md:h-10`}
                      disabled={
                        isLoadingOnboarding ||
                        onboarding?.hasCompletedOnboardingForClothes
                      }
                    >
                      Go
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <li
                      className={`list-disc text-xs md:text-base ${
                        onboarding?.hasCompletedOnboardingForOutfits
                          ? "text-green-500"
                          : "text-indigo-900"
                      } ${
                        onboarding?.hasCompletedOnboardingForOutfits
                          ? "line-through"
                          : ""
                      }`}
                    >
                      Create an outfit
                    </li>
                    <button
                      onClick={() => {
                        setActive(false);
                        startOnboardingOutfit();
                      }}
                      className={`inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300 ${
                        onboarding?.hasCompletedOnboardingForOutfits
                          ? "opacity-50 cursor-not-allowed text-green-300 border-green-300 bg-green-100/70"
                          : ""
                      } text-xs h-8 md:text-base md:h-10`}
                      disabled={
                        isLoadingOnboarding ||
                        onboarding?.hasCompletedOnboardingForOutfits
                      }
                    >
                      Go
                    </button>
                  </div>
                </ul>
              </div>
            </div>
          ) : (
            <div
              className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl w-full max-w-xl mx-auto p-3 shadow-md text-base flex flex-col cursor-pointer hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
              onClick={() => {
                setActive((prev) => !prev);
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M19 12l-6 6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default CheckList;
