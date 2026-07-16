"use client";
import { driver, Driver } from "driver.js";
import { isMobile } from "react-device-detect";
import { almaariDriverDefaults } from "./onboardingTourShared";

let tour: Driver | null = null;
let tourRunning = false;

export function isOnboardingTourRunning() {
  return tourRunning;
}

export async function startOnboardingTour() {
  const addButtonSelector = isMobile
    ? "#add-clothes-btn-mobile"
    : "#add-clothes-btn-desktop";

  tourRunning = true;

  tour = driver({
    ...almaariDriverDefaults,
    onDestroyed: () => {
      tourRunning = false;
      tour = null;
    },
    steps: [
      {
        element: addButtonSelector,
        popover: {
          title: "Welcome to the app! Add your first item",
          description: "Click this button to add your first item.",
          showButtons: [],
          side: "top",
        },
      },
      {
        popover: {
          title: "Fill in the form",
          description: "Fill in the form to add your clothing item.",
          side: "top",
        },
      },
      {
        element: "#AI_analyze_button",
        popover: {
          title: "Analyze your clothing item",
          description:
            "Click this button to analyze your clothing item quickly! Skipping manual steps.",
          side: "left",
          showButtons: ["next"],
          nextBtnText: "Got it",
          doneBtnText: "Got it",
        },
      },
    ],
  });

  tour.drive();
}

export function goToNextTourStep() {
  if (!tour || !tourRunning) return;

  const addClothesForm = document.getElementById("add-clothes-form");
  if (addClothesForm) {
    tour.moveNext();
  } else {
    setTimeout(() => {
      goToNextTourStep();
    }, 100);
  }
}
