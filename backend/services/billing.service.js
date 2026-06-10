import { getStripe } from "../libs/stripe.client.js";
import connectMongoDB from "../libs/mongodb.js";
import Purchase from "../models/Purchase.js";
import { User } from "../models/Users.js";
import { getCreditPackage } from "../constants/creditPackages.js";
import { addCredits } from "./credit.service.js";

/**
 * Step 2 of the flow: create a Stripe Payment Intent for a fixed,
 * backend-defined credit package and persist a `pending` Purchase record.
 *
 * The frontend only supplies `packageId`. Amount and credits are resolved
 * server-side from constants and are never trusted from the client.
 */
export const createPaymentIntentForPackage = async ({ auth0Id, packageId }) => {
  if (!auth0Id || typeof auth0Id !== "string") {
    throw { status: 400, message: "auth0Id is required" };
  }

  const pkg = getCreditPackage(packageId);
  if (!pkg) {
    throw { status: 400, message: "Invalid credit package" };
  }

  await connectMongoDB();

  // Ensure the user actually exists before taking money for them.
  const user = await User.findOne({ auth0Id }, { _id: 1 });
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const stripe = getStripe();

  // Create the audit record first (pending) so we always have a trail,
  // even if Stripe PI creation fails afterwards.
  const purchase = await Purchase.create({
    auth0Id,
    packageId: pkg.id,
    credits: pkg.credits,
    amount: pkg.amount,
    currency: pkg.currency,
    status: "pending",
  });

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.amount,
      currency: pkg.currency,
      // Card-style automatic capture; succeeds → payment_intent.succeeded.
      automatic_payment_methods: { enabled: true },
      metadata: {
        auth0Id,
        packageId: pkg.id,
        credits: String(pkg.credits),
        purchaseRecordId: String(purchase._id),
      },
    });
  } catch (err) {
    await Purchase.updateOne(
      { _id: purchase._id },
      { $set: { status: "failed", failureReason: "stripe_pi_create_failed" } },
    );
    throw {
      status: 502,
      message: "Failed to create payment intent",
      details: err.message,
    };
  }

  purchase.stripePaymentIntentId = paymentIntent.id;
  await purchase.save();

  return {
    clientSecret: paymentIntent.client_secret,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    packageId: pkg.id,
    credits: pkg.credits,
    amount: pkg.amount,
    currency: pkg.currency,
  };
};

// How long a `payment_received` fulfillment lock is considered fresh. If a
// worker dies mid-fulfillment, a later Stripe retry can reclaim the lock after
// this window so credits can still be granted.
const FULFILLMENT_LOCK_MS = 60_000;

/**
 * Step 4: fulfill credits from a verified Stripe event.
 *
 * Idempotency + correctness guarantees:
 *  - A delivery first atomically claims the record into `payment_received`,
 *    which acts as an exclusive lock. `fulfilled` is never claimable, so a
 *    completed grant can never be repeated. Concurrent deliveries see the
 *    fresh lock and back off (`inProgress`).
 *  - The record is marked `fulfilled` ONLY after `addCredits` succeeds, so
 *    `fulfilled` always means credits were actually granted.
 *  - If the credit grant fails, the record is moved to `fulfillment_failed`
 *    (payment succeeded, credits pending) and we throw so Stripe retries; the
 *    retry can reclaim from `fulfillment_failed` and try again — still exactly
 *    once because `fulfilled` blocks re-claiming.
 */
export const fulfillPaymentIntent = async (event) => {
  const paymentIntent = event.data.object;
  const metadata = paymentIntent.metadata || {};
  const { auth0Id, packageId, purchaseRecordId } = metadata;

  await connectMongoDB();

  // Resolve the package server-side; never trust metadata credit counts.
  const pkg = getCreditPackage(packageId);
  if (!pkg || !auth0Id) {
    // Not one of our credit purchases (or malformed metadata) — ignore safely.
    return { handled: false, reason: "unrecognized_payment_intent" };
  }

  const stripeSummary = {
    paymentIntentId: paymentIntent.id,
    amountReceived: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    paymentStatus: paymentIntent.status,
  };

  const idMatch = [{ stripePaymentIntentId: paymentIntent.id }];
  if (purchaseRecordId) {
    idMatch.push({ _id: purchaseRecordId });
  }

  const now = new Date();
  const staleLockBefore = new Date(now.getTime() - FULFILLMENT_LOCK_MS);

  // Atomically acquire the fulfillment lock. Claimable when the record is in a
  // retryable state, or when a previous `payment_received` lock has gone stale
  // (worker likely crashed). `fulfilled` is intentionally excluded so credits
  // are never granted twice.
  const claimed = await Purchase.findOneAndUpdate(
    {
      $and: [
        { $or: idMatch },
        {
          $or: [
            { status: { $in: ["pending", "fulfillment_failed"] } },
            {
              status: "payment_received",
              paymentReceivedAt: { $lt: staleLockBefore },
            },
          ],
        },
      ],
    },
    {
      $set: {
        status: "payment_received",
        paymentReceivedAt: now,
        stripePaymentIntentId: paymentIntent.id,
        stripeEventId: event.id,
        stripeMetadata: stripeSummary,
        failureReason: null,
        // Keep server-defined values authoritative.
        auth0Id,
        packageId: pkg.id,
        credits: pkg.credits,
        amount: pkg.amount,
        currency: pkg.currency,
      },
    },
    { new: true },
  );

  if (!claimed) {
    // Either already fulfilled (idempotent no-op) or another delivery holds a
    // fresh lock and is mid-fulfillment.
    const existing = await Purchase.findOne({ $or: idMatch }, { status: 1 });
    if (existing?.status === "fulfilled") {
      return { handled: true, alreadyFulfilled: true };
    }
    return { handled: true, inProgress: true };
  }

  try {
    const { creditBalance } = await addCredits(auth0Id, pkg.credits);
    // Mark fulfilled ONLY after credits are actually granted.
    await Purchase.updateOne(
      { _id: claimed._id },
      { $set: { status: "fulfilled", fulfilledAt: new Date(), failureReason: null } },
    );
    return {
      handled: true,
      alreadyFulfilled: false,
      creditsAdded: pkg.credits,
      creditBalance,
    };
  } catch (err) {
    // Payment succeeded but the grant failed: mark as a fulfillment incident
    // (retryable) and throw so Stripe redelivers the event.
    await Purchase.updateOne(
      { _id: claimed._id },
      {
        $set: {
          status: "fulfillment_failed",
          fulfilledAt: null,
          failureReason: err.message || "credit_grant_failed",
        },
      },
    );
    throw {
      status: 500,
      message: "Failed to grant credits during fulfillment",
      details: err.message,
    };
  }
};

/** Mark a purchase failed for audit (non-fatal). */
export const markPaymentFailed = async (event) => {
  const paymentIntent = event.data.object;
  await connectMongoDB();
  // Never overwrite a record whose payment already succeeded (fulfilled or in
  // the middle of fulfillment); only an un-paid `pending` PI can fail.
  await Purchase.updateOne(
    { stripePaymentIntentId: paymentIntent.id, status: "pending" },
    {
      $set: {
        status: "failed",
        failureReason:
          paymentIntent.last_payment_error?.message || "payment_failed",
        stripeEventId: event.id,
      },
    },
  );
  return { handled: true };
};

/**
 * Recover fulfillment when the Stripe webhook was missed (common in local dev
 * without `stripe listen`). Verifies payment status directly with the Stripe
 * API, then runs the same idempotent fulfillPaymentIntent path. The client
 * never supplies payment success — Stripe does.
 */
export const reconcilePurchaseFulfillment = async ({
  auth0Id,
  paymentIntentId,
}) => {
  if (!auth0Id || typeof auth0Id !== "string") {
    throw { status: 400, message: "auth0Id is required" };
  }
  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    throw { status: 400, message: "paymentIntentId is required" };
  }

  await connectMongoDB();

  const purchase = await Purchase.findOne(
    { stripePaymentIntentId: paymentIntentId },
    { auth0Id: 1, status: 1, credits: 1, packageId: 1, fulfilledAt: 1 },
  );

  if (!purchase) {
    throw { status: 404, message: "Purchase not found" };
  }
  if (purchase.auth0Id !== auth0Id) {
    throw { status: 404, message: "Purchase not found" };
  }

  if (purchase.status === "fulfilled") {
    return {
      status: purchase.status,
      credits: purchase.credits,
      packageId: purchase.packageId,
      fulfilledAt: purchase.fulfilledAt,
      reconciled: false,
      alreadyFulfilled: true,
    };
  }

  const stripe = getStripe();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    return {
      status: purchase.status,
      credits: purchase.credits,
      packageId: purchase.packageId,
      fulfilledAt: purchase.fulfilledAt,
      reconciled: false,
      reason: "payment_not_succeeded",
      stripeStatus: paymentIntent.status,
    };
  }

  await fulfillPaymentIntent({
    id: `reconcile_${paymentIntentId}_${Date.now()}`,
    data: { object: paymentIntent },
  });

  const updated = await Purchase.findOne(
    { stripePaymentIntentId: paymentIntentId },
    { status: 1, credits: 1, packageId: 1, fulfilledAt: 1 },
  );

  return {
    status: updated?.status ?? purchase.status,
    credits: updated?.credits ?? purchase.credits,
    packageId: updated?.packageId ?? purchase.packageId,
    fulfilledAt: updated?.fulfilledAt ?? null,
    reconciled: true,
    alreadyFulfilled: updated?.status === "fulfilled",
  };
};

/**
 * Read-only purchase status for the frontend to confirm credit fulfillment
 * after payment. Scoped to the requesting user — a user can only read their
 * own purchase. Returns a normalized status; credits are never granted here.
 */
export const getPurchaseStatus = async ({ auth0Id, paymentIntentId }) => {
  if (!auth0Id || typeof auth0Id !== "string") {
    throw { status: 400, message: "auth0Id is required" };
  }
  if (!paymentIntentId || typeof paymentIntentId !== "string") {
    throw { status: 400, message: "paymentIntentId is required" };
  }

  await connectMongoDB();

  const purchase = await Purchase.findOne(
    { stripePaymentIntentId: paymentIntentId },
    {
      auth0Id: 1,
      status: 1,
      credits: 1,
      packageId: 1,
      fulfilledAt: 1,
    },
  );

  if (!purchase) {
    throw { status: 404, message: "Purchase not found" };
  }
  if (purchase.auth0Id !== auth0Id) {
    // Don't leak existence of other users' purchases.
    throw { status: 404, message: "Purchase not found" };
  }

  return {
    status: purchase.status,
    credits: purchase.credits,
    packageId: purchase.packageId,
    fulfilledAt: purchase.fulfilledAt,
  };
};
