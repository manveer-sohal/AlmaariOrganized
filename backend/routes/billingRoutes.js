import express from "express";
import {
  getBillingConfig,
  createPaymentIntent,
  getPurchaseStatus,
  reconcilePurchase,
} from "../controllers/billingController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

// JSON routes (the webhook route is mounted separately in App.js with a raw
// body parser so Stripe signature verification works).
router.get("/config", getBillingConfig);
router.post("/create-payment-intent", requireAuth, createPaymentIntent);
// Poll fulfillment status after payment. Caller identity is resolved from the
// verified access token; ownership is enforced server-side.
router.get(
  "/purchase-status/:paymentIntentId",
  requireAuth,
  getPurchaseStatus,
);
router.post(
  "/reconcile-purchase/:paymentIntentId",
  requireAuth,
  reconcilePurchase,
);

export default router;
