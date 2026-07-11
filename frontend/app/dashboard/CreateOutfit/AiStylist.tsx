"use client";

import Image from "next/image";
import { ClothingItem } from "../../types/clothes";
import {
  OutfitRecommendation,
  SLOT_LABELS,
} from "../../types/aiStylist";

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
  onSwapItem: () => void;
  onFeedback: (
    recommendation: OutfitRecommendation,
    rating: "positive" | "negative",
  ) => void;
  onBuyCredits?: () => void;
};

function RecommendationSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
      <div className="mb-2 h-4 w-24 rounded bg-indigo-200" />
      <div className="mb-3 h-3 w-full rounded bg-indigo-200" />
      <div className="flex gap-2">
        <div className="h-14 w-14 rounded bg-indigo-200" />
        <div className="h-14 w-14 rounded bg-indigo-200" />
        <div className="h-14 w-14 rounded bg-indigo-200" />
      </div>
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
}: AiStylistPanelProps) {
  const hasCredits = credits == null || credits >= 1;

  if (clothesCount === 0) {
    return (
      <div
        id="ai-stylist"
        className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-4 shadow-md w-full"
      >
        <h3 className="font-medium text-indigo-900">AI Stylist</h3>
        <p className="mt-2 text-sm text-indigo-800">
          Add clothing in enough categories (top, bottom, and shoes) before
          Almaari can build outfits from your wardrobe.
        </p>
      </div>
    );
  }

  return (
    <div
      id="ai-stylist"
      className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md w-full"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-medium text-indigo-900">AI Stylist</h3>
          <p className="text-[10px] text-indigo-700/70">
            Generate 3 outfits · 1 credit
          </p>
        </div>
        {status === "success" && (
          <button
            type="button"
            onClick={onTryAnother}
            disabled={!hasCredits}
            className="text-xs font-medium px-3 h-8 rounded-lg border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white disabled:opacity-60"
          >
            Try Another
          </button>
        )}
      </div>

      {status === "idle" && (
        <div className="space-y-3">
          <p className="text-sm text-indigo-900">
            Create an outfit from your wardrobe. Choose an occasion and Almaari
            will build three complete looks using clothes you already own.
          </p>
          <button
            type="button"
            onClick={onGenerateClick}
            disabled={!hasCredits}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Generate Outfits
          </button>
          {!hasCredits && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
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
        <div className="space-y-3">
          <p className="text-sm text-indigo-800">
            Building three looks from your wardrobe...
          </p>
          <RecommendationSkeleton />
          <RecommendationSkeleton />
          <RecommendationSkeleton />
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <p className="text-sm text-red-700">
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
            className="rounded-xl border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-50 disabled:opacity-60"
          >
            Retry
          </button>
        </div>
      )}

      {status === "success" && (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
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
              <div
                key={recommendation.id}
                className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                      {recommendation.label}
                    </p>
                    <h4 className="font-medium text-indigo-900">
                      {recommendation.name}
                    </h4>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Thumbs up"
                      onClick={() => onFeedback(recommendation, "positive")}
                      className={`rounded-md border px-2 py-1 text-xs ${
                        feedbackSubmitted[recommendation.id] === "positive"
                          ? "border-green-400 bg-green-50"
                          : "border-indigo-200"
                      }`}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      aria-label="Thumbs down"
                      onClick={() => onFeedback(recommendation, "negative")}
                      className={`rounded-md border px-2 py-1 text-xs ${
                        feedbackSubmitted[recommendation.id] === "negative"
                          ? "border-red-300 bg-red-50"
                          : "border-indigo-200"
                      }`}
                    >
                      👎
                    </button>
                  </div>
                </div>
                <p className="mb-2 text-sm text-indigo-800">
                  {recommendation.explanation}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {items.map((item) => (
                    <div key={item._id} className="w-16 text-center">
                      <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-indigo-200">
                        <Image
                          src={item.imageSrc}
                          alt={item.type}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="mt-1 text-[10px] text-indigo-700">
                        {SLOT_LABELS[item.slot] || item.slot}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onUseOutfit(recommendation)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    Use Outfit
                  </button>
                  <button
                    type="button"
                    onClick={onSwapItem}
                    className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-900 hover:bg-indigo-100"
                  >
                    Swap Item
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
