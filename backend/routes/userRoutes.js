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
import { requireInternalApiSecret } from "../middleware/requireInternalApiSecret.js";
import { loginRateLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post(
  "/login",
  loginRateLimiter,
  requireInternalApiSecret,
  syncUserOnLogin,
);

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
