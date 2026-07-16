"use client";

import { Coins } from "lucide-react";

type CreditsBalanceButtonProps = {
  credits?: number | null;
  isLoading?: boolean;
  onBuyCredits: () => void;
  active?: boolean;
  /** Match settings dropdown row buttons */
  compact?: boolean;
};

const dropdownBtnClass =
  "inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300 disabled:cursor-wait";

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
        className={
          compact
            ? `${dropdownBtnClass} animate-pulse pointer-events-none`
            : "w-full animate-pulse rounded-xl border border-indigo-200 bg-indigo-100/50 shadow-md m-1 p-2 py-2"
        }
        aria-busy="true"
        aria-label="Loading credits"
      >
        {compact ? (
          <>
            <div className="h-4 w-4 rounded bg-indigo-200/80" />
            <div className="h-4 w-24 rounded bg-indigo-200/80" />
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-indigo-200/80" />
              <div className="h-4 w-20 rounded bg-indigo-200/80" />
            </div>
            <div className="h-3 w-14 rounded bg-indigo-200/60" />
          </div>
        )}
      </div>
    );
  }

  if (credits == null) return null;

  if (compact) {
    return (
      <button
        type="button"
        onClick={onBuyCredits}
        title="Buy more credits"
        disabled={isLoading}
        className={`${dropdownBtnClass} ${
          active ? "bg-indigo-500 text-white border-indigo-500" : ""
        }`}
      >
        <Coins className="w-4 h-4 shrink-0" />
        <span>
          Credits{" "}
          {isLoading ? (
            <span
              className="inline-block h-4 w-6 align-middle animate-pulse rounded bg-indigo-200/80"
              aria-label="Updating credits"
            />
          ) : (
            credits
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onBuyCredits}
      title="Buy more credits"
      disabled={isLoading}
      className={`w-full text-sm text-indigo-900 flex flex-col justify-center items-center bg-indigo-100/70 rounded-xl  m-1 p-2 py-1 shadow-md transition-colors duration-200 cursor-pointer hover:bg-indigo-500 hover:text-white hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-wait ${
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
      <span className="text-xs mt-1 opacity-80">+ Buy more</span>
    </button>
  );
}
