import express from "express";
import {
  getOnboardingStatus,
  updateUserHasCompletedOnboardingForClothes,
  updateUserHasCompletedOnboardingForOutfits,
  setOnboardingStep,
  getUserRole,
  syncUserOnLogin,
  getData,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// Bootstrap only — called server-side from Auth0 callback (no bearer token yet).
router.post("/login", syncUserOnLogin);

router.post("/data", requireAuth, getData);
router.post("/onboarding", requireAuth, getOnboardingStatus);
router.post("/setOnboardingStep", requireAuth, setOnboardingStep);
router.post("/role", requireAuth, getUserRole);
router.post(
  "/updateUserHasCompletedOnboardingForClothes",
  requireAuth,
  updateUserHasCompletedOnboardingForClothes,
);
router.post(
  "/updateUserHasCompletedOnboardingForOutfits",
  requireAuth,
  updateUserHasCompletedOnboardingForOutfits,
);

export default router;
