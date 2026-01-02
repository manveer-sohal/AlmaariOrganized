"use client";
import { driver, Driver } from "driver.js";

let tour: Driver | null = null;

export function startOnboardingTour() {
  tour = driver({
    showProgress: true,
    allowClose: false,
    disableActiveInteraction: false, // IMPORTANT
    steps: [
      {
        element: "#add-clothes-btn",
        popover: {
          title: "Welcome to the app! Add your first item",
          description: "Click this button to add your first item.",
          showButtons: [],
        },
      },
      {
        element: "#add-clothes-form",
        popover: {
          title: "Fill in the form",
          description: "Fill in the form to add your clothing item.",
          showButtons: ["close"],
        },
      },
    ],
  });

  tour.drive();
}

export function goToNextTourStep() {
  tour?.moveNext();
}
