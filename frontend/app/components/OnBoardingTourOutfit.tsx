"use client";
import { driver, Driver } from "driver.js";

let tour: Driver | null = null;

export function startOnboardingTourOutfit() {
  let description = "click this button to create an outfit.";
  let id = "#desktop-sidebar-button";
  console.log(window.innerWidth);
  //check if screen is small or medium
  if (window.innerWidth < 768) {
    description =
      'Scroll to the right and click the "Create Outfit" button to create an outfit.';
    id = "#mobile-sidebar-ul";
    console.log("mobile sidebar ul");
  }

  setTimeout(() => {
    tour = driver({
      showProgress: true,
      steps: [
        {
          element: id,
          popover: {
            title: "Create an outfit",
            description: description,
            showButtons: [],
          },
        },
        {
          element: "#create-outfit-form",
          popover: {
            title: "Build From Your Wardrobe",
            description:
              "Click on the items in your wardrobe to add them to your outfit.",
          },
        },

        {
          element: "#outfit-preview",
          popover: {
            title: "Preview your outfit!",
            description:
              "Preview your outfit to see how it looks. Clothes can be layered and they can be removed when clicked.",
          },
        },
        {
          element: "#ai-stylist",
          popover: {
            title: "Say Hi to your AI Stylist!",
            description:
              "An AI Stylist is available to help you create an outfit. Providing a tips on how to improve your outfit.",
          },
        },
        {
          element: "#create-outfit-form-name",
          popover: {
            title: "Give your outfit a name!",
            description: "Finally, give your outfit a name and save it!",
          },
        },
      ],
    });

    tour.drive();
  }, 400);
}

export function goToNextTourStepOutfit() {
  const checkIfCreateOutfitFormLoaded = () => {
    const createOutfitForm = document.getElementById("create-outfit-form");
    if (createOutfitForm) {
      tour?.moveNext();
    } else {
      setTimeout(() => {
        checkIfCreateOutfitFormLoaded();
      }, 100);
    }
  };
  checkIfCreateOutfitFormLoaded();
}
