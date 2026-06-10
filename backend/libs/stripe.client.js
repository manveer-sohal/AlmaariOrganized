import Stripe from "stripe";
import dotenv from "dotenv";

if (process.env.NODE_ENV !== "test") {
  dotenv.config();
}

let stripeSingleton = null;

/**
 * Lazily construct the Stripe client so the app can boot (and run tests)
 * without a key configured. Throws a clear error only when billing is used.
 */
export const getStripe = () => {
  if (stripeSingleton) return stripeSingleton;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw {
      status: 500,
      message: "Stripe is not configured (missing STRIPE_SECRET_KEY)",
    };
  }

  stripeSingleton = new Stripe(secretKey, {
    apiVersion: "2024-06-20",
  });
  return stripeSingleton;
};
