"use client";

import { Coins } from "lucide-react";

type CreditsBalanceButtonProps = {
  credits?: number | null;
  isLoading?: boolean;
  onBuyCredits: () => void;
  active?: boolean;
  /** Compact layout for the mobile top bar */
  compact?: boolean;
};

export default function CreditsBalanceButton({
  credits,
  isLoading = false,
  onBuyCredits,
  active = false,
  compact = false,
}: CreditsBalanceButtonProps) {
  if (isLoading && credits == null) {
    return (
      <div
        className={`w-full animate-pulse rounded-xl border border-indigo-200 bg-indigo-100/50 shadow-md ${
          compact ? "m-1 px-3 py-2" : "m-1 p-2 py-2"
        }`}
        aria-busy="true"
        aria-label="Loading credits"
      >
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-indigo-200/80" />
            <div className="h-4 w-20 rounded bg-indigo-200/80" />
          </div>
          {!compact && (
            <div className="h-3 w-14 rounded bg-indigo-200/60" />
          )}
        </div>
      </div>
    );
  }

  if (credits == null) return null;

  return (
    <button
      type="button"
      onClick={onBuyCredits}
      title="Buy more credits"
      disabled={isLoading}
      className={`w-full text-sm text-indigo-900 flex flex-col justify-center items-center bg-indigo-100/70 border rounded-xl m-1 p-2 py-1 shadow-md transition-colors duration-200 cursor-pointer hover:bg-indigo-500 hover:text-white hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-wait ${
        active
          ? "border-indigo-600 ring-2 ring-indigo-400/50 bg-indigo-500 text-white"
          : "border-indigo-900"
      }`}
    >
      <span className="text-base font-medium flex items-center gap-2">
        <Coins className="w-4 h-4" />
        Credits{" "}
        {isLoading ? (
          <span
            className="inline-block h-4 w-6 animate-pulse rounded bg-indigo-200/80"
            aria-label="Updating credits"
          />
        ) : (
          credits
        )}
      </span>
      {!compact && (
        <span className="text-xs mt-1 opacity-80">+ Buy more</span>
      )}
    </button>
  );
}
