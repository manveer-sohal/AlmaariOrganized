import { User } from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";
import { DEFAULT_CREDIT_BALANCE } from "../constants/credits.js";
import {
  CREDIT_PACKAGES,
  CREDIT_PACKAGE_IDS,
} from "../constants/creditPackages.js";

const missingCreditBalanceFilter = {
  $or: [{ creditBalance: { $exists: false } }, { creditBalance: null }],
};

/** Persist creditBalance for legacy users who only had a Mongoose default on read. */
export const ensureCreditBalanceField = async (auth0Id) => {
  if (!auth0Id) {
    throw { status: 400, message: "auth0Id is required" };
  }

  await connectMongoDB();

  await User.updateOne(
    { auth0Id, ...missingCreditBalanceFilter },
    { $set: { creditBalance: DEFAULT_CREDIT_BALANCE } },
  );
};

export const getCreditBalance = async (auth0Id) => {
  if (!auth0Id) {
    throw { status: 400, message: "auth0Id is required" };
  }

  await connectMongoDB();
  await ensureCreditBalanceField(auth0Id);

  const user = await User.findOne({ auth0Id }, { creditBalance: 1 });
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const balance = user.creditBalance;
  if (typeof balance !== "number" || Number.isNaN(balance)) {
    return DEFAULT_CREDIT_BALANCE;
  }

  return balance;
};

export const deductOneCredit = async (auth0Id) => {
  if (!auth0Id) {
    throw { status: 400, message: "auth0Id is required" };
  }

  await connectMongoDB();
  await ensureCreditBalanceField(auth0Id);

  const user = await User.findOneAndUpdate(
    {
      auth0Id,
      $expr: {
        $gte: [{ $ifNull: ["$creditBalance", DEFAULT_CREDIT_BALANCE] }, 1],
      },
    },
    [
      {
        $set: {
          creditBalance: {
            $subtract: [
              { $ifNull: ["$creditBalance", DEFAULT_CREDIT_BALANCE] },
              1,
            ],
          },
        },
      },
    ],
    { new: true, projection: { creditBalance: 1 } },
  );

  if (!user || user.creditBalance < 0) {
    throw {
      status: 402,
      message: "Insufficient credits",
    };
  }

  return {
    creditsDeducted: 1,
    creditBalance: user.creditBalance,
  };
};

/**
 * Demo / fake purchase — increments credits for a validated package id only.
 * Replace with payment webhook flow when Stripe is integrated.
 */
export const purchaseCreditPackage = async (auth0Id, packageId) => {
  if (!auth0Id) {
    throw { status: 400, message: "auth0Id is required" };
  }

  if (!CREDIT_PACKAGE_IDS.includes(packageId)) {
    throw {
      status: 400,
      message: "Invalid credit package",
    };
  }

  const pkg = CREDIT_PACKAGES[packageId];

  await connectMongoDB();
  await ensureCreditBalanceField(auth0Id);

  const user = await User.findOneAndUpdate(
    { auth0Id },
    { $inc: { creditBalance: pkg.credits } },
    { new: true, projection: { creditBalance: 1 } },
  );

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  return {
    packageId,
    creditsAdded: pkg.credits,
    price: pkg.price,
    creditBalance: user.creditBalance,
  };
};
