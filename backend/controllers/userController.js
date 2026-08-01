import { User } from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";
import { DEFAULT_CREDIT_BALANCE } from "../constants/credits.js";
import { ensureCreditBalanceField } from "../services/credit.service.js";
import {
  createUserRecord,
  ensureProfileOnboardingDefaults,
  findOrCreateUserByAuth0Id,
} from "../services/userBootstrap.service.js";

export const setOnboardingStep = async (req, res) => {
  const auth0Id = req.auth?.sub;
  const { step } = req.body;

  if (!auth0Id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!step) {
    return res.status(400).json({ error: "step is required" });
  }

  let user = await User.findOne({ auth0Id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (step === "clothes") {
    user.hasCompletedOnboardingForClothes = true;
  } else if (step === "outfits") {
    user.hasCompletedOnboardingForOutfits = true;
  }
  await user.save();
  return res.status(200).json({ message: "Onboarding step completed", user });
};

export const getData = async (req, res) => {
  const auth0Id = req.auth?.sub;

  if (!auth0Id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await connectMongoDB();
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    return res.status(500).json({ error: "Failed to connect to MongoDB" });
  }

  let user = await findOrCreateUserByAuth0Id({
    auth0Id,
    email: req.auth?.email,
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  await ensureCreditBalanceField(auth0Id);
  await ensureProfileOnboardingDefaults(auth0Id);
  const refreshed = await User.findOne(
    { auth0Id },
    {
      hasCompletedOnboardingForClothes: 1,
      hasCompletedOnboardingForOutfits: 1,
      onboardingTourSeenAt: 1,
      hasCompletedProfileOnboarding: 1,
      stylePreferences: 1,
      seasonalColorPalette: 1,
      favoriteBrands: 1,
      role: 1,
      creditBalance: 1,
    },
  );

  const creditBalance =
    typeof refreshed?.creditBalance === "number"
      ? refreshed.creditBalance
      : DEFAULT_CREDIT_BALANCE;

  // Legacy users who finished the old driver.js tour (before profile onboarding)
  // skip the wizard only when the profile flag was never written.
  const profileFlag = refreshed.hasCompletedProfileOnboarding;
  let hasCompletedProfileOnboarding;
  if (profileFlag === true) {
    hasCompletedProfileOnboarding = true;
  } else if (profileFlag === false) {
    hasCompletedProfileOnboarding = false;
  } else if (refreshed.onboardingTourSeenAt) {
    hasCompletedProfileOnboarding = true;
  } else {
    hasCompletedProfileOnboarding = false;
  }

  return res.status(200).json({
    hasCompletedOnboardingForClothes: refreshed.hasCompletedOnboardingForClothes,
    hasCompletedOnboardingForOutfits: refreshed.hasCompletedOnboardingForOutfits,
    onboardingTourSeenAt: refreshed.onboardingTourSeenAt ?? null,
    hasCompletedProfileOnboarding,
    stylePreferences: refreshed.stylePreferences ?? [],
    seasonalColorPalette: refreshed.seasonalColorPalette ?? null,
    favoriteBrands: refreshed.favoriteBrands ?? [],
    role: refreshed.role,
    creditBalance,
  });
};

export const completeProfileOnboarding = async (req, res) => {
  const auth0Id = req.auth?.sub;
  const {
    stylePreferences,
    seasonalColorPalette,
    favoriteBrands,
  } = req.body ?? {};

  if (!auth0Id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const styles = Array.isArray(stylePreferences)
    ? stylePreferences
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, 12)
    : [];
  const brands = Array.isArray(favoriteBrands)
    ? favoriteBrands
        .map((b) => String(b).trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];
  const palette =
    typeof seasonalColorPalette === "string" && seasonalColorPalette.trim()
      ? seasonalColorPalette.trim()
      : null;

  if (styles.length < 1) {
    return res
      .status(400)
      .json({ error: "Select at least one style preference" });
  }
  if (!palette) {
    return res.status(400).json({ error: "seasonalColorPalette is required" });
  }
  if (brands.length < 3) {
    return res.status(400).json({ error: "Select at least three brands" });
  }

  await connectMongoDB();
  const user = await User.findOneAndUpdate(
    { auth0Id },
    {
      $set: {
        stylePreferences: styles,
        seasonalColorPalette: palette,
        favoriteBrands: brands,
        hasCompletedProfileOnboarding: true,
        onboardingTourSeenAt: new Date(),
      },
    },
    {
      new: true,
      select:
        "hasCompletedProfileOnboarding onboardingTourSeenAt stylePreferences seasonalColorPalette favoriteBrands hasCompletedOnboardingForClothes hasCompletedOnboardingForOutfits",
    },
  );

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json({
    hasCompletedProfileOnboarding: true,
    onboardingTourSeenAt: user.onboardingTourSeenAt,
    stylePreferences: user.stylePreferences ?? [],
    seasonalColorPalette: user.seasonalColorPalette ?? null,
    favoriteBrands: user.favoriteBrands ?? [],
    hasCompletedOnboardingForClothes: user.hasCompletedOnboardingForClothes,
    hasCompletedOnboardingForOutfits: user.hasCompletedOnboardingForOutfits,
  });
};

export const markOnboardingTourSeen = async (req, res) => {
  const auth0Id = req.auth?.sub;

  if (!auth0Id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await connectMongoDB();
  const user = await User.findOneAndUpdate(
    { auth0Id },
    { $set: { onboardingTourSeenAt: new Date() } },
    { new: true, select: "onboardingTourSeenAt" },
  );

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json({
    onboardingTourSeenAt: user.onboardingTourSeenAt,
  });
};

export const getOnboardingStatus = async (req, res) => {
  const auth0Id = req.auth?.sub;

  if (!auth0Id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await connectMongoDB();
  const user = await User.findOne({ auth0Id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.status(200).json({
    hasCompletedOnboardingForClothes: user.hasCompletedOnboardingForClothes,
    hasCompletedOnboardingForOutfits: user.hasCompletedOnboardingForOutfits,
  });
};

export const updateUserHasCompletedOnboardingForClothes = async (req, res) => {
  const auth0Id = req.auth?.sub;

  if (!auth0Id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await connectMongoDB();
  const user = await User.findOne({ auth0Id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.hasCompletedOnboardingForClothes = true;
  await user.save();
  return res
    .status(200)
    .json({ message: "User has completed onboarding for clothes", user });
};

export const updateUserHasCompletedOnboardingForOutfits = async (req, res) => {
  const auth0Id = req.auth?.sub;

  if (!auth0Id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await connectMongoDB();
  const user = await User.findOne({ auth0Id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.hasCompletedOnboardingForOutfits = true;
  await user.save();
  return res
    .status(200)
    .json({ message: "User has completed onboarding for outfits", user });
};

export const getUserRole = async (req, res) => {
  const auth0Id = req.auth?.sub;

  if (!auth0Id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await connectMongoDB();
  const user = await User.findOne({ auth0Id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.status(200).json({ role: user.role });
};

/** Called from the Auth0 login callback (server-side); not bearer-protected. */
export const syncUserOnLogin = async (req, res) => {
  try {
    const { auth0Id, email } = req.body;

    if (!auth0Id || !email) {
      return res.status(400).json({ error: "auth0Id and email are required" });
    }

    await connectMongoDB();

    let dbUser = await User.findOne({ auth0Id });

    if (!dbUser) {
      dbUser = await createUserRecord({ auth0Id, email });
    } else {
      await ensureProfileOnboardingDefaults(auth0Id);
      await ensureCreditBalanceField(auth0Id);
      dbUser = await User.findOne({ auth0Id });
    }

    return res.status(200).json({ message: "Login Successful", user: dbUser });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ error: "Failed to log in" });
  }
};
