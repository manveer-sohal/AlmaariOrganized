"use client";
import { driver, Driver } from "driver.js";
import { isMobile } from "react-device-detect";

let tour: Driver | null = null;

export async function startOnboardingTour() {
  const addButtonSelector = isMobile
    ? "#add-clothes-btn-mobile"
    : "#add-clothes-btn-desktop";

  tour = driver({
    showProgress: true,

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
          showButtons: ["close"],
        },
      },
    ],
  });

  tour.drive();
}

export function goToNextTourStep() {
  //check if  id="add-clothes-form" has loaded
  const addClothesForm = document.getElementById("add-clothes-form");
  if (addClothesForm) {
    tour?.moveNext();
  } else {
    setTimeout(() => {
      goToNextTourStep();
    }, 100);
  }
}
