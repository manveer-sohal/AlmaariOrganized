/**
 * Server-side source of truth for one-time credit purchases.
 *
 * `amount` is in the smallest currency unit (cents) and is what Stripe charges.
 * The frontend may only send a `packageId`; it never sends amount or credits.
 */
export const CREDIT_PACKAGES = {
  starter: {
    id: "starter",
    label: "Starter",
    credits: 5,
    amount: 199, // $1.99 in cents
    currency: "usd",
  },
  growth: {
    id: "growth",
    label: "Growth",
    credits: 15,
    amount: 499, // $4.99 in cents
    currency: "usd",
  },
  pro: {
    id: "pro",
    label: "Pro",
    credits: 40,
    amount: 1099, // $10.99 in cents
    currency: "usd",
  },
};

export const CREDIT_PACKAGE_IDS = Object.keys(CREDIT_PACKAGES);

/** Returns the package definition for a given id, or null if unknown. */
export const getCreditPackage = (packageId) => {
  if (!packageId || typeof packageId !== "string") return null;
  return CREDIT_PACKAGES[packageId] || null;
};
