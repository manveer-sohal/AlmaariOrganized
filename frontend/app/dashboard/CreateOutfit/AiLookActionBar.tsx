"use client";

import { useEffect, useState } from "react";
import { OutfitRecommendation } from "../../types/aiStylist";
import { stylistNegativeReasons_List } from "../../data/constants";
import { ThumbsDown, ThumbsUp } from "lucide-react";

type AiLookActionBarProps = {
  recommendation: OutfitRecommendation;
  feedbackSubmitted: Record<string, "positive" | "negative">;
  onUseOutfit: (recommendation: OutfitRecommendation) => void;
  onFeedback: (
    recommendation: OutfitRecommendation,
    rating: "positive" | "negative",
    reasons?: string[],
  ) => void;
  className?: string;
};

/** Compact overlay actions for an AI-generated look. */
export default function AiLookActionBar({
  recommendation,
  feedbackSubmitted,
  onUseOutfit,
  onFeedback,
  className = "",
}: AiLookActionBarProps) {
  const [reasonPickerOpen, setReasonPickerOpen] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  useEffect(() => {
    setReasonPickerOpen(false);
    setSelectedReasons([]);
  }, [recommendation.id]);

  const positive = feedbackSubmitted[recommendation.id] === "positive";
  const negative = feedbackSubmitted[recommendation.id] === "negative";

  return (
    <div
      className={`pointer-events-none absolute inset-x-0 bottom-3 z-20 flex flex-col items-center gap-2 ${className}`}
    >
      {reasonPickerOpen && !negative ? (
        <div className="pointer-events-auto mx-3 w-full max-w-sm rounded-xl border border-indigo-200/80 bg-white/95 p-2.5 shadow-lg backdrop-blur-sm">
          <p className="mb-1.5 text-[11px] text-indigo-700">
            Optional — why didn&apos;t this work?
          </p>
          <div className="mb-2 flex max-h-16 flex-wrap gap-1 overflow-y-auto">
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
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    selected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-indigo-200 bg-white text-indigo-800"
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                onFeedback(recommendation, "negative", selectedReasons);
                setReasonPickerOpen(false);
              }}
              className="rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] text-white"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={() => setReasonPickerOpen(false)}
              className="rounded-md border border-indigo-200 px-2.5 py-1 text-[11px] text-indigo-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-indigo-200/60 bg-white/90 py-1 pl-2 pr-1 shadow-md backdrop-blur-sm">
        <button
          type="button"
          onClick={() => onUseOutfit(recommendation)}
          className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Use look
        </button>
        <button
          type="button"
          aria-label="Helpful"
          title="Helpful"
          onClick={() => onFeedback(recommendation, "positive")}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
            positive
              ? "bg-green-100 text-green-700"
              : "text-indigo-600 hover:bg-indigo-50"
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Not helpful"
          title="Not helpful"
          onClick={() => {
            setReasonPickerOpen(true);
            setSelectedReasons([]);
          }}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition ${
            negative
              ? "bg-red-100 text-red-700"
              : "text-indigo-600 hover:bg-indigo-50"
          }`}
        >
          <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
