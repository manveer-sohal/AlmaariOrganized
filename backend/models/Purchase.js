import mongoose from "mongoose";

/**
 * Audit trail + idempotency anchor for one-time Stripe credit purchases.
 *
 * Lifecycle:
 *   pending            → Payment Intent created, awaiting payment
 *   payment_received   → webhook verified payment; acts as the exclusive
 *                        fulfillment lock while credits are being granted
 *   fulfilled          → credits were actually granted (exactly once). This
 *                        state is set ONLY after the credit increment succeeds.
 *   fulfillment_failed → payment succeeded but the credit grant failed; safe
 *                        to retry (Stripe will redeliver). NOT a success.
 *   failed             → payment itself failed / was canceled
 *
 * Idempotency is enforced by the unique `stripePaymentIntentId` plus an atomic
 * claim into `payment_received` (the lock). `fulfilled` is never re-claimable,
 * so credits can never be granted twice; a stale lock can be recovered after a
 * timeout if a worker died mid-fulfillment.
 */
const PurchaseSchema = new mongoose.Schema(
  {
    auth0Id: { type: String, required: true, index: true },
    packageId: { type: String, required: true },
    credits: { type: Number, required: true },
    amount: { type: Number, required: true }, // cents
    currency: { type: String, required: true, default: "usd" },

    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    // The Stripe event id that fulfilled this purchase (for reconciliation).
    stripeEventId: { type: String, default: null },

    status: {
      type: String,
      enum: [
        "pending",
        "payment_received",
        "fulfilled",
        "fulfillment_failed",
        "failed",
      ],
      default: "pending",
      index: true,
    },

    // When the verified payment was first observed (also stamps the lock so a
    // stale `payment_received` lock can be recovered after a timeout).
    paymentReceivedAt: { type: Date, default: null },
    fulfilledAt: { type: Date, default: null },
    failureReason: { type: String, default: null },

    // Normalized snapshot of useful Stripe fields for debugging/support.
    stripeMetadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

const Purchase =
  mongoose.models.Purchase || mongoose.model("Purchase", PurchaseSchema);

export default Purchase;
