import express from "express";
import {
  getOnboardingStatus,
  updateUserHasCompletedOnboardingForClothes,
  updateUserHasCompletedOnboardingForOutfits,
  setOnboardingStep,
  getUserRole,
  syncUserOnLogin,
  getData,
  purchaseCredits,
} from "../controllers/userController.js";

const router = express.Router();

// Define routes

// router.post("/create", POST);
// router.post("/get", getData);
router.post("/login", syncUserOnLogin);
router.post(
  "/updateUserHasCompletedOnboardingForClothes",
  updateUserHasCompletedOnboardingForClothes,
);
router.post(
  "/updateUserHasCompletedOnboardingForOutfits",
  updateUserHasCompletedOnboardingForOutfits,
);
router.post("/onboarding", getOnboardingStatus);
router.post("/setOnboardingStep", setOnboardingStep);
router.post("/role", getUserRole);
router.post("/data", getData);
router.post("/purchase-credits", purchaseCredits);
export default router;
