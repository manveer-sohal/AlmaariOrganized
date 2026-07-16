"use client";

import { useEffect, useState } from "react";
import { OutfitRecommendation } from "../../types/aiStylist";
import { stylistNegativeReasons_List } from "../../data/constants";

type MobileSaveBarProps = {
  selectedCount: number;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
  outfitPosition?: { current: number; total: number } | null;
  /** When set, pins Use Outfit + feedback above Save so they stay on-screen. */
  activeRecommendation?: OutfitRecommendation | null;
  feedbackSubmitted?: Record<string, "positive" | "negative">;
  onFeedback?: (
    recommendation: OutfitRecommendation,
    rating: "positive" | "negative",
    reasons?: string[],
  ) => void;
  onUseOutfit?: (recommendation: OutfitRecommendation) => void;
  name?: string;
  onNameChange?: (value: string) => void;
};

export default function MobileSaveBar({
  selectedCount,
  saving,
  canSave,
  onSave,
  outfitPosition = null,
  activeRecommendation = null,
  feedbackSubmitted = {},
  onFeedback,
  onUseOutfit,
  name,
  onNameChange,
}: MobileSaveBarProps) {
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const showAiActions = Boolean(activeRecommendation && onUseOutfit);

  useEffect(() => {
    setReasonPickerOpen(false);
    setSelectedReasons([]);
  }, [activeRecommendation?.id]);

  return (
    <div
      className="fixed inset-x-0 bottom-[4.25rem] z-30 border-t border-indigo-200 bg-white/95 px-3 py-2 shadow-[0_-4px_16px_rgba(79,70,229,0.08)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-lg flex-col gap-1.5">
        {showAiActions && activeRecommendation ? (
          <>
            {onNameChange ? (
              <input
                type="text"
                value={name ?? ""}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Outfit name (optional)"
                aria-label="Outfit name (optional)"
                className="h-9 w-full rounded-xl border border-indigo-300 bg-white px-3 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            ) : null}

            {reasonPickerOpen &&
              feedbackSubmitted[activeRecommendation.id] !== "negative" && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2">
                  <p className="mb-1.5 text-xs text-indigo-700">
                    Optional — why didn&apos;t this work?
                  </p>
                  <div className="mb-2 flex max-h-20 flex-wrap gap-1 overflow-y-auto">
                    {stylistNegativeReasons_List.map((reason) => {
                      const selected = selectedReasons.includes(reason);
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() =>
                            setSelectedReasons((prev) =>
                              selected
                                ? prev.filter((item) => item !== reason)
                                : [...prev, reason],
                            )
                          }
                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                            selected
                              ? "border-indigo-500 bg-indigo-600 text-white"
                              : "border-indigo-200 text-indigo-800"
                          }`}
                        >
                          {reason}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onFeedback?.(
                          activeRecommendation,
                          "negative",
                          selectedReasons,
                        );
                        setReasonPickerOpen(false);
                        setSelectedReasons([]);
                      }}
                      className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] text-white"
                    >
                      Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReasonPickerOpen(false);
                        setSelectedReasons([]);
                      }}
                      className="rounded-md border border-indigo-200 px-2 py-1 text-[11px] text-indigo-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            <button
              type="button"
              onClick={() => onUseOutfit?.(activeRecommendation)}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Use This Outfit
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Helpful"
                onClick={() => onFeedback?.(activeRecommendation, "positive")}
                className={`min-h-9 flex-1 rounded-xl border px-3 text-sm ${
                  feedbackSubmitted[activeRecommendation.id] === "positive"
                    ? "border-green-400 bg-green-50"
                    : "border-indigo-200 bg-white text-indigo-800"
                }`}
              >
                Helpful
              </button>
              <button
                type="button"
                aria-label="Not helpful"
                onClick={() => {
                  setReasonPickerOpen(true);
                  setSelectedReasons([]);
                }}
                className={`min-h-9 flex-1 rounded-xl border px-3 text-sm ${
                  feedbackSubmitted[activeRecommendation.id] === "negative"
                    ? "border-red-300 bg-red-50"
                    : "border-indigo-200 bg-white text-indigo-800"
                }`}
              >
                Not helpful
              </button>
            </div>
          </>
        ) : null}

        <div className="flex items-center justify-between gap-3 py-0.5">
          <p className="text-sm font-medium text-indigo-800">
            {outfitPosition
              ? `Outfit ${outfitPosition.current} of ${outfitPosition.total}`
              : `${selectedCount} ${selectedCount === 1 ? "item" : "items"} selected`}
          </p>
          <button
            id="mobile-save-outfit-btn"
            type="button"
            disabled={saving || !canSave}
            onClick={onSave}
            className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
              showAiActions
                ? "border border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-50"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {saving ? "Saving..." : "Save Outfit"}
          </button>
        </div>
      </div>
    </div>
  );
}
