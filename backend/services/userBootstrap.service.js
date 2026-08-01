import { User } from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";
import { DEFAULT_CREDIT_BALANCE } from "../constants/credits.js";

export const NEW_USER_DEFAULTS = {
  clothes: [],
  outfits: [],
  hasCompletedOnboardingForClothes: false,
  hasCompletedOnboardingForOutfits: false,
  hasCompletedProfileOnboarding: false,
  onboardingTourSeenAt: null,
  stylePreferences: [],
  seasonalColorPalette: null,
  favoriteBrands: [],
  role: "user",
  creditBalance: DEFAULT_CREDIT_BALANCE,
};

export const createUserRecord = async ({ auth0Id, email }) => {
  await connectMongoDB();
  return User.create({
    auth0Id,
    email,
    ...NEW_USER_DEFAULTS,
  });
};

/** Ensures a MongoDB user exists (post-Auth0 login bootstrap fallback). */
export const findOrCreateUserByAuth0Id = async ({ auth0Id, email }) => {
  await connectMongoDB();
  const existing = await User.findOne({ auth0Id });
  if (existing) {
    return existing;
  }
  if (!email) {
    return null;
  }
  return createUserRecord({ auth0Id, email });
};

/** Backfill profile onboarding for users created before the field existed. */
export const ensureProfileOnboardingDefaults = async (auth0Id) => {
  if (!auth0Id) {
    return;
  }

  await connectMongoDB();
  await User.updateOne(
    {
      auth0Id,
      $or: [
        { hasCompletedProfileOnboarding: { $exists: false } },
        { hasCompletedProfileOnboarding: null },
      ],
    },
    { $set: { hasCompletedProfileOnboarding: false } },
  );
};
