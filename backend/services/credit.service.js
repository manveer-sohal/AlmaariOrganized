import { User } from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";
import { DEFAULT_CREDIT_BALANCE } from "../constants/credits.js";

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
 * Atomically grant credits to a user. This is the ONLY way credits are added,
 * and it is called exclusively from the verified Stripe webhook fulfillment
 * path (never from the frontend or a redirect/success page).
 *
 * Idempotency is the caller's responsibility: the billing service guards each
 * grant behind an atomic `pending -> fulfilled` transition on the Purchase
 * record, so this function is only ever reached once per payment.
 */
export const addCredits = async (auth0Id, credits) => {
  if (!auth0Id) {
    throw { status: 400, message: "auth0Id is required" };
  }

  if (typeof credits !== "number" || !Number.isFinite(credits) || credits <= 0) {
    throw { status: 400, message: "credits must be a positive number" };
  }

  await connectMongoDB();
  await ensureCreditBalanceField(auth0Id);

  const user = await User.findOneAndUpdate(
    { auth0Id },
    { $inc: { creditBalance: credits } },
    { new: true, projection: { creditBalance: 1 } },
  );

  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  return {
    creditsAdded: credits,
    creditBalance: user.creditBalance,
  };
};
