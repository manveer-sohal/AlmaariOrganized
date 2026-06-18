"use client";
import { driver, Driver } from "driver.js";
import { isMobile } from "react-device-detect";

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
    showProgress: true,
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
          side: "left",
        },
      },
      {
        popover: {
          title: "Fill in the form",
          description: "Fill in the form to add your clothing item.",
          side: "left",
        },
      },
      {
        element: "#AI_analyze_button",
        popover: {
          title: "Analyze your clothing item",
          description:
            "Click this button to analyze your clothing item quickly! Skipping manual steps.",
          side: "left",
          showButtons: ["close"],
        },
      },
    ],
  });

  tour.drive();
}

export function goToNextTourStep() {
  const addClothesForm = document.getElementById("add-clothes-form");
  if (addClothesForm) {
    tour?.moveNext();
  } else {
    setTimeout(() => {
      goToNextTourStep();
    }, 100);
  }
}
