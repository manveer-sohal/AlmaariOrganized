"use client";

import { useState } from "react";
import Image from "next/image";
import { ClothingItem, Slot } from "../../types/clothes";
import {
  OutfitRecommendation,
  SLOT_LABELS,
} from "../../types/aiStylist";
import { stylistNegativeReasons_List } from "../../data/constants";
import BuilderSectionHeader from "./BuilderSectionHeader";

type AiStylistPanelProps = {
  status: "idle" | "loading" | "success" | "error";
  recommendations: OutfitRecommendation[];
  clothesById: Map<string, ClothingItem>;
  errorMessage?: string;
  errorCode?: string;
  credits?: number;
  clothesCount: number;
  feedbackSubmitted: Record<string, "positive" | "negative">;
  onGenerateClick: () => void;
  onTryAnother: () => void;
  onUseOutfit: (recommendation: OutfitRecommendation) => void;
  onSwapItem: (slot?: Slot) => void;
  onFeedback: (
    recommendation: OutfitRecommendation,
    rating: "positive" | "negative",
    reasons?: string[],
  ) => void;
  onBuyCredits?: () => void;
  anchorItem?: ClothingItem | null;
  appliedConfirmation?: string | null;
  className?: string;
};

function RecommendationSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="mb-2 h-4 w-24 rounded bg-indigo-200" />
      <div className="mb-2 h-5 w-40 rounded bg-indigo-200" />
      <div className="mb-3 h-3 w-full rounded bg-indigo-200" />
      <div className="mb-3 flex gap-3">
        <div className="h-16 w-16 rounded-xl bg-indigo-200" />
        <div className="h-16 w-16 rounded-xl bg-indigo-200" />
        <div className="h-16 w-16 rounded-xl bg-indigo-200" />
      </div>
      <div className="h-9 w-full rounded-xl bg-indigo-200" />
    </div>
  );
}

export default function AiStylistPanel({
  status,
  recommendations,
  clothesById,
  errorMessage,
  errorCode,
  credits,
  clothesCount,
  feedbackSubmitted,
  onGenerateClick,
  onTryAnother,
  onUseOutfit,
  onSwapItem,
  onFeedback,
  onBuyCredits,
  anchorItem,
  appliedConfirmation,
  className = "",
}: AiStylistPanelProps) {
  const hasCredits = credits == null || credits >= 1;
  const [reasonPickerId, setReasonPickerId] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  const submitNegative = (recommendation: OutfitRecommendation) => {
    onFeedback(recommendation, "negative", selectedReasons);
    setReasonPickerId(null);
    setSelectedReasons([]);
  };

  if (clothesCount === 0) {
    return (
      <div
        id="ai-stylist"
        className={`rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-md backdrop-blur ${className}`}
      >
        <BuilderSectionHeader
          step="03"
          title="AI Stylist"
          description="Create complete outfits using clothes you already own."
        />
        <p className="mt-4 text-sm text-indigo-800">
          Add clothing in enough categories (top, bottom, and shoes) before
          Almaari can build outfits from your wardrobe.
        </p>
      </div>
    );
  }

  return (
    <div
      id="ai-stylist"
      className={`flex min-h-0 flex-col rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-md backdrop-blur ${className}`}
    >
      <BuilderSectionHeader
        step="03"
        title="AI Stylist"
        description="Create complete outfits using clothes you already own."
        action={
          status === "success" ? (
            <button
              type="button"
              onClick={onTryAnother}
              disabled={!hasCredits}
              className="inline-flex min-h-9 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-100/70 px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-500 hover:text-white disabled:opacity-60"
            >
              Try Another
            </button>
          ) : null
        }
      />
      <p className="mt-1 text-[11px] font-medium text-indigo-700/70">
        Generate 3 outfits · 1 credit
        {credits != null ? ` · You have ${credits}` : ""}
      </p>

      {appliedConfirmation ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-800"
        >
          {appliedConfirmation}
        </p>
      ) : null}

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {status === "idle" && (
          <div className="space-y-4">
            {anchorItem ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Style this item
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-indigo-200 bg-white">
                    <Image
                      src={anchorItem.imageSrc}
                      alt={anchorItem.type}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-indigo-900">
                      {anchorItem.type}
                    </p>
                    <p className="text-xs text-indigo-700/75">
                      Almaari will build complete outfits around this piece.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-indigo-800">
                Choose an occasion in the next step, then Almaari will build
                three complete looks from your wardrobe.
              </p>
            )}

            <button
              type="button"
              onClick={onGenerateClick}
              disabled={!hasCredits}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Generate 3 Outfits
            </button>
            {!hasCredits && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p>You need at least 1 credit to generate outfits.</p>
                {onBuyCredits && (
                  <button
                    type="button"
                    onClick={onBuyCredits}
                    className="mt-2 text-indigo-700 underline"
                  >
                    Buy credits
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {status === "loading" && (
          <div className="space-y-3" aria-live="polite">
            <div>
              <p className="text-sm font-medium text-indigo-900">
                Creating outfits from your wardrobe...
              </p>
              <p className="mt-1 text-xs text-indigo-700/75">
                Almaari is matching colors, categories, and your selected
                occasion.
              </p>
            </div>
            <RecommendationSkeleton />
            <RecommendationSkeleton />
            <RecommendationSkeleton />
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-700">
              We couldn&apos;t generate outfits.
            </p>
            <p className="text-sm text-indigo-800">
              {errorMessage || "Something went wrong while generating outfits."}
            </p>
            {(errorCode === "INSUFFICIENT_WARDROBE" ||
              errorCode === "EMPTY_WARDROBE") && (
              <p className="text-sm text-indigo-800">
                Add a top, bottom, and shoes (or a dress and shoes) to continue.
              </p>
            )}
            <button
              type="button"
              onClick={onGenerateClick}
              disabled={!hasCredits}
              className="w-full rounded-xl border border-indigo-300 px-4 py-2.5 text-sm font-semibold text-indigo-900 hover:bg-indigo-50 disabled:opacity-60"
            >
              Try Again
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 pb-1">
            {Object.keys(feedbackSubmitted).length > 0 && (
              <p className="text-xs text-indigo-700/80">
                Thanks — we&apos;ll use this on your next generation.
              </p>
            )}
            {recommendations.map((recommendation) => {
              const items = recommendation.itemIds
                .map((id) => clothesById.get(id))
                .filter(Boolean) as ClothingItem[];

              return (
                <article
                  key={recommendation.id}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"
                >
                  <span className="inline-flex rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                    {recommendation.label}
                  </span>
                  <h4 className="mt-2 text-base font-semibold text-indigo-900">
                    {recommendation.name}
                  </h4>
                  <p className="mt-1 line-clamp-2 text-sm text-indigo-800/90">
                    {recommendation.explanation}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-3">
                    {items.map((item) => (
                      <div key={item._id} className="w-[72px] text-center">
                        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-xl border border-indigo-200 bg-white">
                          <Image
                            src={item.imageSrc}
                            alt={item.type}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] font-medium text-indigo-700">
                          {SLOT_LABELS[item.slot] || item.slot}
                        </p>
                      </div>
                    ))}
                  </div>

                  {reasonPickerId === recommendation.id &&
                    feedbackSubmitted[recommendation.id] !== "negative" && (
                      <div className="mt-3 rounded-lg border border-indigo-100 bg-white p-2">
                        <p className="mb-2 text-xs text-indigo-700">
                          Optional — why didn&apos;t this work?
                        </p>
                        <div className="mb-2 flex flex-wrap gap-1">
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
                            onClick={() => submitNegative(recommendation)}
                            className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] text-white"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReasonPickerId(null);
                              setSelectedReasons([]);
                            }}
                            className="rounded-md border border-indigo-200 px-2 py-1 text-[11px] text-indigo-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      onClick={() => onUseOutfit(recommendation)}
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:flex-none"
                    >
                      Use Outfit
                    </button>
                    <button
                      type="button"
                      onClick={() => onSwapItem()}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100"
                    >
                      Swap Item
                    </button>
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        aria-label="Helpful"
                        onClick={() => onFeedback(recommendation, "positive")}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                          feedbackSubmitted[recommendation.id] === "positive"
                            ? "border-green-400 bg-green-50"
                            : "border-indigo-200 bg-white text-indigo-700"
                        }`}
                      >
                        Helpful
                      </button>
                      <button
                        type="button"
                        aria-label="Not helpful"
                        onClick={() => {
                          setReasonPickerId(recommendation.id);
                          setSelectedReasons([]);
                        }}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                          feedbackSubmitted[recommendation.id] === "negative"
                            ? "border-red-300 bg-red-50"
                            : "border-indigo-200 bg-white text-indigo-700"
                        }`}
                      >
                        Not helpful
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
