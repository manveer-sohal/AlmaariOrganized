"use client";

import React, { useState } from "react";
import {
  CREDIT_PACKAGES,
  CreditPackageId,
  getSavePercent,
} from "../../data/creditPackages";
import { usePurchaseCredits } from "../../hooks/usePurchaseCredits";

type BuyCreditsProps = {
  onBack: () => void;
};

function BuyCredits({ onBack }: BuyCreditsProps) {
  const { mutateAsync: purchaseCredits, isPending, error } =
    usePurchaseCredits();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activePackage, setActivePackage] = useState<CreditPackageId | null>(
    null,
  );

  const handlePurchase = async (packageId: CreditPackageId) => {
    setSuccessMessage(null);
    setActivePackage(packageId);
    try {
      const result = await purchaseCredits(packageId);
      setSuccessMessage(
        result.message ??
          `Success! You now have ${result.creditBalance} credits.`,
      );
    } catch {
      // error from mutation
    } finally {
      setActivePackage(null);
    }
  };

  return (
    <div className="min-h-full w-full px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors duration-200"
        >
          ← Back
        </button>

        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-semibold text-indigo-900 tracking-tight">
            Top up your credits
          </h1>
          <p className="mt-3 text-indigo-900/70 text-base max-w-xl mx-auto">
            Get more AI analyses and keep organizing faster. Choose the credit
            pack that fits your workflow.
          </p>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-emerald-800 text-sm font-medium"
          >
            {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-red-700 text-sm"
          >
            {error.message}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {CREDIT_PACKAGES.map((pkg) => {
            const savePercent = getSavePercent(pkg.credits, pkg.price);
            const isHighlighted = pkg.highlighted;
            const isLoading = isPending && activePackage === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col rounded-3xl border bg-white/90 backdrop-blur p-6 shadow-md transition-shadow hover:shadow-lg ${
                  isHighlighted
                    ? "border-indigo-400 ring-2 ring-indigo-300/60 scale-[1.02] md:scale-105 z-10"
                    : "border-indigo-200"
                }`}
              >
                {isHighlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow">
                    Best value
                  </span>
                )}

                {savePercent > 0 && (
                  <span
                    className={`absolute top-4 right-4 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isHighlighted
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    Save {savePercent}%
                  </span>
                )}

                <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider">
                  {pkg.label}
                </p>
                <p className="mt-4 text-4xl font-bold text-indigo-900">
                  {pkg.credits}
                  <span className="text-lg font-medium text-indigo-900/60 ml-1">
                    credits
                  </span>
                </p>
                <p className="mt-2 text-2xl font-semibold text-indigo-800">
                  ${pkg.price.toFixed(2)}
                </p>
                <p className="mt-3 text-sm text-indigo-900/65 flex-grow">
                  {pkg.description}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-indigo-900/70">
                  <li>• Instant credit delivery</li>
                  <li>• Use for AI clothing analysis</li>
                </ul>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePurchase(pkg.id)}
                  className={`mt-6 w-full inline-flex items-center justify-center gap-2 font-medium px-4 h-11 rounded-xl cursor-pointer transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${
                    isHighlighted
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                      : "border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white"
                  }`}
                >
                  {isLoading ? "Processing…" : `Get ${pkg.credits} Credits`}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-xs text-indigo-900/50 max-w-lg mx-auto">
          Demo purchase — no real payment is processed. Credits are added to
          your account immediately for testing.
        </p>
      </div>
    </div>
  );
}

export default BuyCredits;
