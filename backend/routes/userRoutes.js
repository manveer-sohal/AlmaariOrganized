import express from "express";
import {
  test,
  getOnboardingStatus,
  updateUserHasCompletedOnboardingForClothes,
  updateUserHasCompletedOnboardingForOutfits,
  setOnboardingStep,
} from "../controllers/userController.js";

const router = express.Router();

// Define routes

// router.post("/create", POST);
// router.post("/get", getData);
router.post("/login", test);
router.post(
  "/updateUserHasCompletedOnboardingForClothes",
  updateUserHasCompletedOnboardingForClothes
);
router.post(
  "/updateUserHasCompletedOnboardingForOutfits",
  updateUserHasCompletedOnboardingForOutfits
);
router.post("/onboarding", getOnboardingStatus);
router.post("/setOnboardingStep", setOnboardingStep);
export default router;
