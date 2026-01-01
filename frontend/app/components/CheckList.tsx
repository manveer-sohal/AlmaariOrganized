import { useMemo, useState } from "react";
import { startOnboardingTourOutfit } from "./OnBoardingTourOutfit";
import { startOnboardingTour } from "./OnBoardingTour";
function CheckList({
  hasCompletedOnboardingForClothes,
  hasCompletedOnboardingForOutfits,
}: {
  hasCompletedOnboardingForClothes: boolean;
  hasCompletedOnboardingForOutfits: boolean;
}) {
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
  use;

  return (
    <div className=" absolute top-20 right-0 z-10 flex justify-end">
      {active ? (
        <div className="bg-white/40 backdrop-blur border border-indigo-200 rounded-xl w-full max-w-xl mx-auto p-6 shadow-md text-base flex flex-col">
          <button
            className="flex justify-start absolute top-0 left-0 p-1 cursor-pointer"
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
                  className={` list-disc ${
                    hasCompletedOnboardingForClothes
                      ? "text-green-500"
                      : "text-indigo-900"
                  } ${hasCompletedOnboardingForClothes ? "line-through" : ""}`}
                >
                  Add a picture of your first item
                </li>
                <button
                  onClick={startOnboardingClothes}
                  className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300 "
                >
                  Go
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <li
                  className={`list-disc ${
                    hasCompletedOnboardingForOutfits
                      ? "text-green-500"
                      : "text-indigo-900"
                  } ${hasCompletedOnboardingForOutfits ? "line-through" : ""}`}
                >
                  Create an outfit
                </li>
                <button
                  onClick={startOnboardingOutfit}
                  className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
                >
                  Go
                </button>
              </div>
            </ul>
          </div>
        </div>
      ) : (
        <div
          className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl w-full max-w-xl mx-auto p-6 shadow-md text-base flex flex-col"
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
        </div>
      )}
    </div>
  );
}

export default CheckList;
