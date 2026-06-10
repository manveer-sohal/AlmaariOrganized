"use client";

import React, { useMemo, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  CREDIT_PACKAGES,
  CreditPackageId,
  getSavePercent,
} from "../../data/creditPackages";
import {
  useCreatePaymentIntent,
  useConfirmCreditsFulfilled,
  useReconcilePurchase,
} from "../../hooks/usePurchaseCredits";

type BuyCreditsProps = {
  onBack: () => void;
};

// Cache the Stripe.js loader per publishable key (loadStripe should run once).
let stripePromiseCache: {
  key: string;
  promise: Promise<Stripe | null>;
} | null = null;

const getStripePromise = (publishableKey: string) => {
  if (!stripePromiseCache || stripePromiseCache.key !== publishableKey) {
    stripePromiseCache = {
      key: publishableKey,
      promise: loadStripe(publishableKey),
    };
  }
  return stripePromiseCache.promise;
};

type ActiveCheckout = {
  packageId: CreditPackageId;
  clientSecret: string;
  publishableKey: string;
  credits: number;
};

function CheckoutForm({
  checkout,
  onPaymentSucceeded,
  onPaymentProcessing,
  onCancel,
}: {
  checkout: ActiveCheckout;
  onPaymentSucceeded: (paymentIntentId: string) => void;
  onPaymentProcessing: (paymentIntentId: string) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (!paymentIntent) {
      setErrorMessage("Payment could not be completed. Please try again.");
      setSubmitting(false);
      return;
    }

    // `succeeded` is the only Stripe state that triggers the credit-granting
    // webhook (payment_intent.succeeded). Only then do we begin confirming
    // that credits were actually fulfilled.
    if (paymentIntent.status === "succeeded") {
      onPaymentSucceeded(paymentIntent.id);
      return;
    }

    // `processing` (common with 3DS2/async methods) is NOT final success. The
    // charge may still complete or fail. Surface a distinct "still processing"
    // state — do not imply payment is done or credits were granted.
    if (paymentIntent.status === "processing") {
      onPaymentProcessing(paymentIntent.id);
      return;
    }

    // `requires_payment_method` (auth failed/declined) or any other non-final
    // status: keep the user on the form to retry.
    setErrorMessage(
      paymentIntent.status === "requires_payment_method"
        ? "Your payment was not completed. Please try a different payment method."
        : "Payment could not be completed. Please try again.",
    );
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement />

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center font-medium px-4 min-h-11 h-11 rounded-xl border border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-100 transition-colors duration-200 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 inline-flex items-center justify-center font-medium px-4 min-h-11 h-11 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {submitting ? (
            "Processing…"
          ) : (
            <>
              <span className="sm:hidden">Pay · {checkout.credits} credits</span>
              <span className="hidden sm:inline">
                Pay for {checkout.credits} credits
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// UI phases that explicitly separate Stripe payment state from credit
// fulfillment state. These never blur "processing", "succeeded" and "granted".
//   idle       → choosing a package
//   processing → Stripe still processing the charge (e.g. 3DS2); NOT final
//   confirming → payment succeeded; waiting for webhook to grant credits
//   confirmed  → backend confirmed credits were actually granted
//   delayed    → payment progressed but credits not confirmed in time
type Phase = "idle" | "processing" | "confirming" | "confirmed" | "delayed";

function BuyCredits({ onBack }: BuyCreditsProps) {
  const {
    mutateAsync: createPaymentIntent,
    isPending,
    error,
  } = useCreatePaymentIntent();
  const confirmCreditsFulfilled = useConfirmCreditsFulfilled();
  const reconcilePurchase = useReconcilePurchase();

  const [activePackage, setActivePackage] = useState<CreditPackageId | null>(
    null,
  );
  const [checkout, setCheckout] = useState<ActiveCheckout | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pendingPaymentIntentId, setPendingPaymentIntentId] = useState<
    string | null
  >(null);
  const [isRechecking, setIsRechecking] = useState(false);

  const stripePromise = useMemo(
    () =>
      checkout?.publishableKey
        ? getStripePromise(checkout.publishableKey)
        : null,
    [checkout?.publishableKey],
  );

  const handleSelectPackage = async (packageId: CreditPackageId) => {
    setPhase("idle");
    setActivePackage(packageId);
    try {
      const result = await createPaymentIntent(packageId);
      if (!result.publishableKey) {
        throw new Error("Payments are not configured. Please try again later.");
      }
      setCheckout({
        packageId,
        clientSecret: result.clientSecret!,
        publishableKey: result.publishableKey,
        credits: result.credits ?? 0,
      });
    } catch {
      // surfaced via `error`
    } finally {
      setActivePackage(null);
    }
  };

  // Stripe reports payment SUCCEEDED. This fires the credit-granting webhook,
  // but credits still aren't granted until the backend confirms it. Poll the
  // backend (source of truth) before declaring success.
  const handlePaymentSucceeded = async (paymentIntentId: string) => {
    setCheckout(null);
    setPendingPaymentIntentId(paymentIntentId);
    setPhase("confirming");

    try {
      const outcome = await confirmCreditsFulfilled(paymentIntentId);
      setPhase(outcome === "fulfilled" ? "confirmed" : "delayed");
    } catch {
      // Never leave the UI stuck on "confirming" if polling throws.
      setPhase("delayed");
    }
  };

  // Stripe reports payment PROCESSING (common with 3DS2). The charge isn't
  // final yet, so this is explicitly NOT success. The webhook will flip the
  // purchase to fulfilled once Stripe finishes, so we poll the backend with a
  // longer window. We never claim payment is done while in this phase.
  const handlePaymentProcessing = async (paymentIntentId: string) => {
    setCheckout(null);
    setPendingPaymentIntentId(paymentIntentId);
    setPhase("processing");

    try {
      const outcome = await confirmCreditsFulfilled(paymentIntentId, {
        attempts: 20,
        intervalMs: 3000,
      });
      setPhase(outcome === "fulfilled" ? "confirmed" : "delayed");
    } catch {
      setPhase("delayed");
    }
  };

  const handleRecheckCredits = async () => {
    if (!pendingPaymentIntentId) return;
    setIsRechecking(true);
    setPhase("confirming");
    try {
      const outcome = await reconcilePurchase(pendingPaymentIntentId);
      setPhase(outcome === "fulfilled" ? "confirmed" : "delayed");
    } catch {
      setPhase("delayed");
    } finally {
      setIsRechecking(false);
    }
  };

  const handleCancelCheckout = () => {
    setCheckout(null);
    setPendingPaymentIntentId(null);
    setPhase("idle");
  };

  return (
    <div className="min-h-full w-full overflow-x-hidden px-3 py-5 pb-24 sm:px-4 sm:py-8 md:px-8 md:py-12 md:pb-12">
      <div className="mx-auto max-w-5xl w-full">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 sm:mb-6 inline-flex items-center gap-2 font-medium px-4 min-h-10 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-indigo-600 transition-colors duration-200"
        >
          ← Back
        </button>

        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-indigo-900 tracking-tight">
            Top up your credits
          </h1>
          <p className="mt-2 sm:mt-3 text-indigo-900/70 text-sm sm:text-base max-w-xl mx-auto px-1">
            Get more AI analyses and keep organizing faster. Choose the credit
            pack that fits your workflow.
          </p>
        </div>

        {phase === "processing" && (
          <div
            role="status"
            className="mb-5 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 sm:px-4 sm:text-center text-sky-800 text-sm font-medium"
          >
            <span
              aria-hidden
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600 sm:mx-auto"
            />
            <p className="flex-1 sm:text-center">
              Your payment is still processing. We’ll confirm your credits once
              Stripe finishes — this can take a moment.
            </p>
          </div>
        )}

        {phase === "confirming" && (
          <div
            role="status"
            className="mb-5 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-3 sm:px-4 sm:text-center text-indigo-800 text-sm font-medium"
          >
            <span
              aria-hidden
              className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600 sm:mx-auto"
            />
            <p className="flex-1 sm:text-center">
              Payment received. Confirming your credits…
            </p>
          </div>
        )}

        {phase === "confirmed" && (
          <div
            role="status"
            className="mb-5 sm:mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 sm:px-4 text-left sm:text-center text-emerald-800 text-sm font-medium"
          >
            Success! Your credits have been added to your account.
          </div>
        )}

        {phase === "delayed" && (
          <div
            role="status"
            className="mb-5 sm:mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-4 sm:px-4 text-left sm:text-center text-amber-800 text-sm font-medium space-y-3"
          >
            <p>
              Your payment was received, but your credits are still being
              confirmed. This can happen if the Stripe webhook hasn’t reached
              the server yet (common in local development).
            </p>
            {pendingPaymentIntentId && (
              <button
                type="button"
                onClick={handleRecheckCredits}
                disabled={isRechecking}
                className="w-full sm:w-auto inline-flex items-center justify-center font-medium px-4 min-h-11 h-11 rounded-xl bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800 transition-colors duration-200 disabled:opacity-60"
              >
                {isRechecking ? "Checking…" : "Check again for credits"}
              </button>
            )}
            <p className="text-xs text-amber-700/80">
              You have not been charged twice. If credits still don’t appear,
              contact support with your payment confirmation.
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-5 sm:mb-8 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 sm:px-4 text-left sm:text-center text-red-700 text-sm"
          >
            {error.message}
          </div>
        )}

        {phase === "processing" || phase === "confirming" ? null : checkout &&
          stripePromise ? (
          <div className="mx-auto w-full max-w-md rounded-2xl sm:rounded-3xl border border-indigo-200 bg-white/90 backdrop-blur p-4 sm:p-6 shadow-md">
            <h2 className="text-base sm:text-lg font-semibold text-indigo-900 mb-1">
              Complete your purchase
            </h2>
            <p className="text-sm text-indigo-900/70 mb-4 sm:mb-5">
              {checkout.credits} credits
            </p>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: checkout.clientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <CheckoutForm
                checkout={checkout}
                onPaymentSucceeded={handlePaymentSucceeded}
                onPaymentProcessing={handlePaymentProcessing}
                onCancel={handleCancelCheckout}
              />
            </Elements>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 pt-2">
            {CREDIT_PACKAGES.map((pkg) => {
              const savePercent = getSavePercent(pkg.credits, pkg.price);
              const isHighlighted = pkg.highlighted;
              const isLoading = isPending && activePackage === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col rounded-2xl sm:rounded-3xl border bg-white/90 backdrop-blur p-4 sm:p-6 shadow-md transition-shadow hover:shadow-lg ${
                    isHighlighted
                      ? "border-indigo-400 ring-2 ring-indigo-300/60 md:scale-105 z-10"
                      : "border-indigo-200"
                  }`}
                >
                  {isHighlighted && (
                    <span className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-white shadow whitespace-nowrap">
                      Best value
                    </span>
                  )}

                  {savePercent > 0 && (
                    <span
                      className={`absolute top-3 right-3 sm:top-4 sm:right-4 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold ${
                        isHighlighted
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      Save {savePercent}%
                    </span>
                  )}

                  <p className="text-xs sm:text-sm font-medium text-indigo-600 uppercase tracking-wider pr-16">
                    {pkg.label}
                  </p>
                  <p className="mt-3 sm:mt-4 text-3xl sm:text-4xl font-bold text-indigo-900">
                    {pkg.credits}
                    <span className="text-base sm:text-lg font-medium text-indigo-900/60 ml-1">
                      credits
                    </span>
                  </p>
                  <p className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-semibold text-indigo-800">
                    ${pkg.price.toFixed(2)}
                  </p>
                  <p className="mt-2 sm:mt-3 text-sm text-indigo-900/65 flex-grow">
                    {pkg.description}
                  </p>
                  <ul className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-indigo-900/70">
                    <li>• Secure card payment via Stripe</li>
                    <li>• Use for AI clothing analysis</li>
                  </ul>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`mt-4 sm:mt-6 w-full inline-flex items-center justify-center gap-2 font-medium px-4 min-h-11 h-11 rounded-xl cursor-pointer transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] ${
                      isHighlighted
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                        : "border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white"
                    }`}
                  >
                    {isLoading ? "Starting…" : `Get ${pkg.credits} Credits`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-6 sm:mt-10 text-center text-xs text-indigo-900/50 max-w-lg mx-auto px-2">
          Payments are securely processed by Stripe. Credits are added to your
          account once payment is confirmed.
        </p>
      </div>
    </div>
  );
}

export default BuyCredits;
