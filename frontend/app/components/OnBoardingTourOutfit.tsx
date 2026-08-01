"use client";
import { driver, Driver, DriveStep } from "driver.js";
import { almaariDriverDefaults } from "./onboardingTourShared";

let tour: Driver | null = null;
let tourRunning = false;

export function isOnboardingTourOutfitRunning() {
  return tourRunning;
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.innerWidth < 768;
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

function desktopSteps(): DriveStep[] {
  return [
    {
      element: "#create-outfit-btn-desktop",
      popover: {
        title: "Create an outfit",
        description: "Click Create to open the outfit builder.",
        showButtons: [],
        side: "right",
        align: "start",
      },
    },
    {
      element: "#builder-panel-clothes",
      popover: {
        title: "Pick from your wardrobe",
        description:
          "Click items to add them to your look. Anchor pieces you want the AI to keep.",
        side: "right",
        showButtons: ["next"],
        align: "start",
      },
    },
    {
      element: "#builder-panel-preview",
      popover: {
        title: "Preview your look",
        description:
          "See layers as you build. Tap a piece to remove it, or Anchor pieces you want to keep across AI suggestions.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "#desktop-ai-stylist-btn",
      popover: {
        title: "Meet your AI Stylist",
        description:
          "Click AI Stylist to open the panel from the right. Generate 3 outfit ideas for 1 credit, then browse them with the arrows in the preview carousel.",
        side: "left",
        align: "start",
      },
    },
    {
      element: "#create-outfit-form-name",
      popover: {
        title: "Name and save",
        description:
          "Give your outfit an optional name, then hit Save Outfit when you like the look.",
        side: "bottom",
        align: "end",
      },
    },
  ];
}

function mobileSteps(): DriveStep[] {
  return [
    {
      element: "#create-outfit-btn",
      popover: {
        title: "Create an outfit",
        description: "Tap Create in the bottom bar to open the outfit builder.",
        showButtons: [],
        side: "top",
        align: "center",
      },
    },
    {
      element: "#mobile-outfit-builder",
      disableActiveInteraction: true,
      popover: {
        title: "Your outfit canvas",
        description:
          "Build manually or let Almaari style you. Your look appears here as you add pieces.",
        side: "bottom",
        showButtons: ["next"],
        align: "center",
      },
    },
    {
      element: "#mobile-edit-pieces-btn",
      disableActiveInteraction: true,
      popover: {
        title: "Edit pieces",
        description:
          "Tap Edit pieces to open your wardrobe and add items to the outfit yourself.",
        side: "top",
        showButtons: ["next"],
        align: "start",
      },
    },
    {
      element: "#mobile-ask-stylist-btn",
      disableActiveInteraction: true,
      popover: {
        title: "Ask stylist",
        description:
          "Tap Ask stylist for AI outfit recommendations from your wardrobe. Almaari generates 3 looks for 1 credit.",
        side: "top",
        showButtons: ["next"],
        align: "end",
      },
    },
    {
      element: "#mobile-save-outfit-btn",
      disableActiveInteraction: true,
      popover: {
        title: "Save your outfit",
        description:
          "When you have a couple of pieces (or after using an AI look), save from the bar at the bottom.",
        side: "top",
        align: "end",
      },
    },
  ];
}

export async function startOnboardingTourOutfit() {
  if (tourRunning) return;
  tourRunning = true;

  const mobile = isMobileViewport();
  const createSelector = mobile
    ? "#create-outfit-btn"
    : "#create-outfit-btn-desktop";
  const steps = mobile ? mobileSteps() : desktopSteps();

  if (mobile) {
    document.getElementById("create-outfit-btn")?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  const createBtn = await waitForElement(createSelector);
  if (!createBtn) {
    tourRunning = false;
    return;
  }

  tour = driver({
    ...almaariDriverDefaults,
    onDestroyed: () => {
      tourRunning = false;
      tour = null;
    },
    steps,
  });
  tour.drive();
}

export async function goToNextTourStepOutfit() {
  if (!tour || !tourRunning) return;

  const mobile = isMobileViewport();
  const nextSelector = mobile
    ? "#mobile-outfit-builder"
    : "#builder-panel-clothes";

  const el = await waitForElement(nextSelector);
  if (!el) {
    tour.destroy();
    return;
  }

  setTimeout(() => {
    tour?.moveNext();
  }, 150);
}
