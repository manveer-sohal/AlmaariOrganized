import { getStripe } from "../libs/stripe.client.js";
import {
  createPaymentIntentForPackage,
  fulfillPaymentIntent,
  markPaymentFailed,
  getPurchaseStatus as getPurchaseStatusService,
  reconcilePurchaseFulfillment,
} from "../services/billing.service.js";
import { CREDIT_PACKAGES } from "../constants/creditPackages.js";

/** Public, non-secret billing config for the frontend (publishable key + packages). */
export const getBillingConfig = async (_req, res) => {
  return res.status(200).json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    packages: Object.values(CREDIT_PACKAGES).map((pkg) => ({
      id: pkg.id,
      label: pkg.label,
      credits: pkg.credits,
      amount: pkg.amount,
      currency: pkg.currency,
    })),
  });
};

/** Step 2: create a Payment Intent for a fixed package. */
export const createPaymentIntent = async (req, res) => {
  try {
    const auth0Id = req.auth?.sub;
    const { packageId } = req.body;

    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!packageId || typeof packageId !== "string") {
      return res.status(400).json({ success: false, message: "packageId is required" });
    }

    const result = await createPaymentIntentForPackage({ auth0Id, packageId });

    return res.status(200).json({
      success: true,
      clientSecret: result.clientSecret,
      publishableKey: result.publishableKey,
      packageId: result.packageId,
      credits: result.credits,
      amount: result.amount,
      currency: result.currency,
    });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to create payment intent",
    });
  }
};

/**
 * Step 3: poll purchase/fulfillment status after payment confirmation.
 *
 * The frontend uses this to wait for ACTUAL credit fulfillment (webhook) rather
 * than treating Stripe payment confirmation as success. Identity comes from the
 * verified access token (req.auth.sub); ownership is enforced server-side.
 */
export const getPurchaseStatus = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const auth0Id = req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await getPurchaseStatusService({ auth0Id, paymentIntentId });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to fetch purchase status",
    });
  }
};

/**
 * Recover missed webhook fulfillment by verifying payment status with Stripe
 * server-side, then running the same idempotent grant path.
 */
export const reconcilePurchase = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const auth0Id = req.auth?.sub;

    if (!auth0Id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await reconcilePurchaseFulfillment({
      auth0Id,
      paymentIntentId,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Failed to reconcile purchase",
    });
  }
};

/**
 * Step 4: Stripe webhook. MUST receive the raw request body (configured in
 * App.js with express.raw before any JSON parser) so signature verification
 * works. Credits are granted ONLY here, after signature verification.
 */
export const stripeWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"];

  if (!webhookSecret) {
    console.error("[billing] STRIPE_WEBHOOK_SECRET is not configured");
    return res.status(500).send("Webhook secret not configured");
  }

  let event;
  try {
    const stripe = getStripe();
    // req.body is a Buffer here thanks to express.raw().
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error("[billing] Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        console.info("[billing] Webhook payment_intent.succeeded", event.id);
        await fulfillPaymentIntent(event);
        break;
      case "payment_intent.payment_failed":
        await markPaymentFailed(event);
        break;
      default:
        // Ignore unrelated events.
        break;
    }
  } catch (err) {
    // Return 500 so Stripe retries delivery; fulfillment stays idempotent.
    console.error("[billing] Webhook handling error:", err.message);
    return res.status(500).json({ received: true, error: err.message });
  }

  return res.status(200).json({ received: true });
};
