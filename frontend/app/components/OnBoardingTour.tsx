"use client";
import { driver, Driver, DriveStep } from "driver.js";
import { isMobile } from "react-device-detect";
import { almaariDriverDefaults } from "./onboardingTourShared";

let tour: Driver | null = null;
let tourRunning = false;

export function isOnboardingTourRunning() {
  return tourRunning;
}

function waitForElement(
  selector: string,
  { timeoutMs = 8000, intervalMs = 100 } = {},
): Promise<Element | null> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      const el = document.querySelector(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        resolve(null);
        return;
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

function clothesFormTourSteps(): DriveStep[] {
  return [
    {
      element: "#add-clothes-form",
      popover: {
        title: "How this form works",
        description:
          "Every detail you add—type, colour, material, fit, and pattern—helps Almaari's AI suggest better outfits. The more complete your item, the smarter your recommendations.",
        side: "top",
        showButtons: ["next"],
        align: "start",
      },
    },
    {
      element: "#add-picture-btn",
      popover: {
        title: "Add a photo",
        description:
          "Tap to add an image of your item. Place your garment inside the crop guide for the best results—a clear, well-framed photo helps Almaari style your wardrobe.",
        side: "bottom",
        showButtons: ["next"],
        align: "center",
      },
    },
    {
      element: "#crop-overlay-select",
      popover: {
        title: "Crop guide",
        description:
          "Pick the guide that matches your piece (T-shirt is selected by default). Use it to frame the item before you save.",
        side: "bottom",
        showButtons: ["next"],
        align: "start",
      },
    },
    {
      element: "#AI_analyze_button",
      popover: {
        title: "Analyze image",
        description:
          "Want to fill in the form faster? Upload a photo, then tap Analyze Image. Almaari's AI will read your item and fill in the details for you.",
        side: "top",
        showButtons: ["next"],
        nextBtnText: "Got it",
        doneBtnText: "Got it",
        align: "end",
      },
    },
  ];
}

function clothesTourSteps(addButtonSelector: string): DriveStep[] {
  return [
    {
      element: addButtonSelector,
      popover: {
        title: "Add your first item",
        description: "Click here to open the add-clothes form.",
        showButtons: [],
        side: isMobile ? "top" : "right",
        align: "start",
      },
    },
    ...clothesFormTourSteps(),
  ];
}

export function stopOnboardingTour() {
  tour?.destroy();
}

export async function startOnboardingTour() {
  if (tourRunning) return;

  const addButtonSelector = isMobile
    ? "#add-clothes-btn-mobile"
    : "#add-clothes-btn-desktop";

  tourRunning = true;

  const addBtn = await waitForElement(addButtonSelector);
  if (!addBtn) {
    tourRunning = false;
    return;
  }

  tour = driver({
    ...almaariDriverDefaults,
    onDestroyed: () => {
      tourRunning = false;
      tour = null;
    },
    steps: clothesTourSteps(addButtonSelector),
  });

  tour.drive();
}

export async function startOnboardingTourFromForm() {
  if (tourRunning) return;

  tourRunning = true;

  const form = await waitForElement("#add-clothes-form");
  if (!form) {
    tourRunning = false;
    return;
  }

  tour = driver({
    ...almaariDriverDefaults,
    onDestroyed: () => {
      tourRunning = false;
      tour = null;
    },
    steps: clothesFormTourSteps(),
  });

  tour.drive();
}

export async function goToNextTourStep() {
  if (!tour || !tourRunning) return;

  const el = await waitForElement("#add-clothes-form");
  if (!el) {
    tour.destroy();
    return;
  }

  setTimeout(() => {
    tour?.moveNext();
  }, 150);
}
