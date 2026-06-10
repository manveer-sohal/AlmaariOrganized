import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@auth0/nextjs-auth0/client";
import { CreditPackageId } from "../data/creditPackages";
import { clearAuthTokenCache, getAuthHeaders } from "../utils/getAuthHeaders";

type CreatePaymentIntentResponse = {
  success: boolean;
  message?: string;
  clientSecret?: string;
  publishableKey?: string | null;
  packageId?: string;
  credits?: number;
  amount?: number;
  currency?: string;
};

/**
 * Starts a production Stripe payment by creating a Payment Intent on the
 * backend. Credits are NOT granted here — the verified webhook grants them.
 * The frontend only sends the packageId; pricing/credits are resolved server
 * side.
 */
export const useCreatePaymentIntent = () => {
  const { user } = useUser();

  return useMutation({
    mutationFn: async (packageId: CreditPackageId) => {
      if (!user?.sub) {
        throw new Error("You must be logged in to purchase credits.");
      }

      const postPaymentIntent = async () =>
        fetch("/api/billing/create-payment-intent", {
          method: "POST",
          headers: await getAuthHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ packageId }),
        });

      let response = await postPaymentIntent();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await postPaymentIntent();
      }

      const data: CreatePaymentIntentResponse = await response.json();

      if (!response.ok || !data.success || !data.clientSecret) {
        throw new Error(data.message || "Failed to start checkout");
      }

      return data;
    },
  });
};

/** Raw purchase lifecycle status as reported by the backend. */
export type PurchaseStatus =
  | "pending"
  | "payment_received"
  | "fulfilled"
  | "fulfillment_failed"
  | "failed";

/** Normalized outcome of waiting for credits to be fulfilled. */
export type FulfillmentOutcome = "fulfilled" | "delayed" | "failed";

/**
 * Waits for ACTUAL credit fulfillment after a Stripe payment is confirmed.
 *
 * Stripe payment confirmation only means the charge succeeded — credits are
 * granted asynchronously by the verified webhook. This polls the backend
 * purchase-status endpoint (the source of truth) until the webhook reports
 * `fulfilled`, then refreshes the cached user balance. If fulfillment doesn't
 * land within the polling window it resolves to `delayed` (NOT success).
 */
export const useConfirmCreditsFulfilled = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const fetchStatus = useCallback(
    async (paymentIntentId: string): Promise<PurchaseStatus | null> => {
      if (!user?.sub) return null;
      const fetchPurchaseStatus = async () =>
        fetch(
          `/api/billing/purchase-status/${encodeURIComponent(paymentIntentId)}`,
          { headers: await getAuthHeaders() },
        );

      let response = await fetchPurchaseStatus();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await fetchPurchaseStatus();
      }
      // Transient auth failures during polling should not abort fulfillment
      // waiting or leave the UI stuck — treat as "status unknown" and retry.
      if (response.status === 401 || !response.ok) return null;
      const data = await response.json();
      return (data?.status as PurchaseStatus) ?? null;
    },
    [user?.sub],
  );

  const reconcilePurchase = useCallback(
    async (paymentIntentId: string): Promise<PurchaseStatus | null> => {
      if (!user?.sub) return null;

      const postReconcile = async () =>
        fetch(
          `/api/billing/reconcile-purchase/${encodeURIComponent(paymentIntentId)}`,
          {
            method: "POST",
            headers: await getAuthHeaders(),
          },
        );

      let response = await postReconcile();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await postReconcile();
      }
      if (!response.ok) return null;

      const data = await response.json();
      return (data?.status as PurchaseStatus) ?? null;
    },
    [user?.sub],
  );

  return useCallback(
    async (
      paymentIntentId: string,
      { attempts = 15, intervalMs = 2000 } = {},
    ): Promise<FulfillmentOutcome> => {
      if (!user?.sub) return "delayed";

      for (let i = 0; i < attempts; i++) {
        let status: PurchaseStatus | null = null;
        try {
          status = await fetchStatus(paymentIntentId);
        } catch {
          // Network / session hiccup — keep polling until the window expires.
          status = null;
        }

        if (status === "fulfilled") {
          // Pull the new balance into the cache now that credits exist.
          await queryClient.invalidateQueries({
            queryKey: ["user", user.sub],
          });
          return "fulfilled";
        }

        // Payment itself failed — surface distinctly from a fulfillment delay.
        if (status === "failed") {
          return "failed";
        }

        // pending / payment_received / fulfillment_failed → keep waiting; a
        // failed grant may be retried by Stripe shortly.
        if (i < attempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
      }

      // Webhook may have been missed (common in local dev). Ask the backend to
      // verify payment status with Stripe directly, then grant credits if due.
      let reconciledStatus: PurchaseStatus | null = null;
      try {
        reconciledStatus = await reconcilePurchase(paymentIntentId);
      } catch {
        reconciledStatus = null;
      }

      if (reconciledStatus === "fulfilled") {
        await queryClient.invalidateQueries({
          queryKey: ["user", user.sub],
        });
        return "fulfilled";
      }

      return "delayed";
    },
    [fetchStatus, reconcilePurchase, queryClient, user?.sub],
  );
};

/** Manually retry fulfillment for a paid purchase (e.g. from the delayed banner). */
export const useReconcilePurchase = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useCallback(
    async (paymentIntentId: string): Promise<FulfillmentOutcome> => {
      if (!user?.sub) return "delayed";

      const postReconcile = async () =>
        fetch(
          `/api/billing/reconcile-purchase/${encodeURIComponent(paymentIntentId)}`,
          {
            method: "POST",
            headers: await getAuthHeaders(),
          },
        );

      let response = await postReconcile();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await postReconcile();
      }
      if (!response.ok) return "delayed";

      const data = await response.json();
      if (data?.status === "fulfilled") {
        await queryClient.invalidateQueries({
          queryKey: ["user", user.sub],
        });
        return "fulfilled";
      }

      return "delayed";
    },
    [queryClient, user?.sub],
  );
};
