"use client";

import Image from "next/image";
import { ClothingItem } from "../../types/clothes";
import {
  STYLIST_MODE_META,
  StylistMode,
  StylistOccasion,
  StylistPreferences,
  StylistStyle,
  StylistWeather,
} from "../../types/aiStylist";
import { humanizeClothingSubtype } from "../../utils/clothingSubtype";
import { Anchor } from "lucide-react";
import { useOverlayFocus } from "./useOverlayFocus";
import { useCallback } from "react";

const MODE_ORDER: StylistMode[] = ["random", "complete", "improve", "selected"];
const OCCASIONS: StylistOccasion[] = [
  "Everyday",
  "Work",
  "Dinner",
  "Party",
  "Formal",
  "Other",
];
const WEATHER_OPTIONS: StylistWeather[] = ["Warm", "Mild", "Cold"];
const STYLE_OPTIONS: StylistStyle[] = [
  "Casual",
  "Smart casual",
  "Minimal",
  "Streetwear",
];

type AIStylistBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  mode: StylistMode;
  onModeChange: (mode: StylistMode) => void;
  preferences: StylistPreferences;
  onPreferencesChange: (preferences: StylistPreferences) => void;
  anchoredItems: ClothingItem[];
  onUnanchorItem?: (id: string) => void;
  onAnchorAllPreview?: () => void;
  canAnchorAll: boolean;
  status: "idle" | "loading" | "success" | "error";
  errorMessage?: string;
  errorCode?: string;
  credits?: number;
  clothesCount: number;
  canGenerate: boolean;
  onGenerate: () => void;
  onBuyCredits?: () => void;
  hasHistory: boolean;
  refinementPrompt: string;
  onRefinementPromptChange: (value: string) => void;
  onRefine: () => void;
};

export default function AIStylistBottomSheet({
  open,
  onClose,
  mode,
  onModeChange,
  preferences,
  onPreferencesChange,
  anchoredItems,
  onUnanchorItem,
  onAnchorAllPreview,
  canAnchorAll,
  status,
  errorMessage,
  errorCode,
  credits,
  clothesCount,
  canGenerate,
  onGenerate,
  onBuyCredits,
  hasHistory,
  refinementPrompt,
  onRefinementPromptChange,
  onRefine,
}: AIStylistBottomSheetProps) {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const containerRef = useOverlayFocus(open, handleClose);
  const modeMeta = STYLIST_MODE_META[mode];
  const hasCredits = credits == null || credits >= 1;
  const isLoading = status === "loading";

  if (!open) return null;

  if (clothesCount === 0) {
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        <button
          type="button"
          className="absolute inset-0 bg-black/40"
          aria-label="Close"
          onClick={handleClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-sheet-title"
          className="absolute inset-x-0 bottom-0 max-h-[90vh] rounded-t-3xl border border-indigo-200 bg-white p-4 shadow-2xl"
        >
          <h2 id="ai-sheet-title" className="text-lg font-semibold text-indigo-900">
            AI Stylist
          </h2>
          <p className="mt-2 text-sm text-indigo-800">
            Add clothes to your wardrobe before generating an outfit.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-4 w-full rounded-xl border border-indigo-300 px-4 py-3 text-sm font-semibold text-indigo-900"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 motion-reduce:transition-none"
        aria-label="Close AI stylist"
        onClick={handleClose}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-sheet-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-3xl border border-indigo-200 bg-white shadow-2xl"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex shrink-0 flex-col items-center pt-2">
          <div
            className="h-1.5 w-10 rounded-full bg-indigo-200"
            aria-hidden
          />
          <div className="mt-2 flex w-full items-start justify-between gap-3 px-4">
            <div>
              <h2
                id="ai-sheet-title"
                className="text-lg font-semibold text-indigo-900"
              >
                AI Stylist
              </h2>
              <p className="mt-0.5 text-xs text-indigo-700/80">
                {hasHistory
                  ? "Refine current results or generate a new set"
                  : "Choose how Almaari should help"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="min-h-11 rounded-xl border border-indigo-200 px-3 text-sm font-medium text-indigo-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-3">
          {isLoading ? (
            <div className="space-y-3 py-6 text-center" aria-live="polite">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm font-medium text-indigo-900">
                {refinementPrompt.trim()
                  ? "Creating new versions from your feedback..."
                  : modeMeta.loading}
              </p>
              <p className="text-xs text-indigo-700/75">
                Generate 3 outfits · 1 credit
                {credits != null ? ` · You have ${credits}` : ""}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                  Mode
                </p>
                <div
                  role="tablist"
                  aria-label="Stylist mode"
                  className="mt-1.5 grid grid-cols-2 gap-1.5"
                >
                  {MODE_ORDER.map((option) => {
                    const active = option === mode;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onModeChange(option)}
                        className={`min-h-11 rounded-xl border px-2 py-2 text-left text-[11px] font-semibold leading-snug ${
                          active
                            ? "border-indigo-500 bg-indigo-600 text-white"
                            : "border-indigo-200 bg-white text-indigo-800"
                        }`}
                      >
                        {STYLIST_MODE_META[option].label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-indigo-700/80">
                  {modeMeta.description}
                </p>
              </div>

              <div className="grid gap-3">
                <label className="grid gap-1 text-sm text-indigo-900">
                  Occasion
                  <select
                    value={preferences.occasion}
                    onChange={(e) =>
                      onPreferencesChange({
                        ...preferences,
                        occasion: e.target.value as StylistOccasion,
                      })
                    }
                    className="min-h-11 rounded-xl border border-indigo-200 px-3 py-2"
                  >
                    {OCCASIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm text-indigo-900">
                  Weather
                  <select
                    value={preferences.weather}
                    onChange={(e) =>
                      onPreferencesChange({
                        ...preferences,
                        weather: e.target.value as StylistWeather,
                      })
                    }
                    className="min-h-11 rounded-xl border border-indigo-200 px-3 py-2"
                  >
                    {WEATHER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm text-indigo-900">
                  Style preference
                  <select
                    value={preferences.style}
                    onChange={(e) =>
                      onPreferencesChange({
                        ...preferences,
                        style: e.target.value as StylistStyle,
                      })
                    }
                    className="min-h-11 rounded-xl border border-indigo-200 px-3 py-2"
                  >
                    {STYLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm text-indigo-900">
                  Anything to avoid?
                  <input
                    type="text"
                    value={preferences.avoid}
                    onChange={(e) =>
                      onPreferencesChange({
                        ...preferences,
                        avoid: e.target.value,
                      })
                    }
                    placeholder="e.g. No heavy jackets"
                    className="min-h-11 rounded-xl border border-indigo-200 px-3 py-2"
                  />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                    Anchored pieces
                  </p>
                  {onAnchorAllPreview && canAnchorAll ? (
                    <button
                      type="button"
                      onClick={onAnchorAllPreview}
                      className="text-[11px] font-semibold text-indigo-700 underline-offset-2 hover:underline"
                    >
                      Anchor all in preview
                    </button>
                  ) : null}
                </div>
                {anchoredItems.length === 0 ? (
                  <p className="mt-1 text-[11px] text-indigo-600/80">
                    Anchor items from the wardrobe drawer to lock them into
                    generations.
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {anchoredItems.map((item) => (
                      <div
                        key={item._id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 py-1 pl-1 pr-2"
                      >
                        <div className="relative h-6 w-6 overflow-hidden rounded-full border border-indigo-200 bg-white">
                          <Image
                            src={item.imageSrc}
                            alt={humanizeClothingSubtype(item)}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Anchor className="h-3 w-3 text-indigo-700" aria-hidden />
                        <span className="max-w-[7rem] truncate text-[11px] font-medium text-indigo-900">
                          {humanizeClothingSubtype(item)}
                        </span>
                        {onUnanchorItem ? (
                          <button
                            type="button"
                            aria-label={`Unanchor ${humanizeClothingSubtype(item)}`}
                            onClick={() => onUnanchorItem(item._id)}
                            className="text-indigo-500"
                          >
                            ×
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {hasHistory ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
                  <p className="text-xs font-semibold text-indigo-800">
                    Refine current results
                  </p>
                  <textarea
                    value={refinementPrompt}
                    onChange={(e) => onRefinementPromptChange(e.target.value)}
                    rows={2}
                    placeholder="Make these more casual, darker, warmer..."
                    className="mt-2 w-full rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button
                    type="button"
                    onClick={onRefine}
                    disabled={!canGenerate || !refinementPrompt.trim()}
                    className="mt-2 w-full rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    Generate New Versions
                  </button>
                </div>
              ) : null}

              {status === "error" ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">
                    We couldn&apos;t generate outfits.
                  </p>
                  <p className="mt-1 text-sm text-indigo-800">
                    {errorMessage || "Something went wrong while generating."}
                  </p>
                  {(errorCode === "INSUFFICIENT_WARDROBE" ||
                    errorCode === "EMPTY_WARDROBE") && (
                    <p className="mt-1 text-sm text-indigo-800">
                      Add a top, bottom, and shoes (or a dress and shoes) to
                      continue.
                    </p>
                  )}
                </div>
              ) : null}

              {!hasCredits ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p>You need at least 1 credit to generate outfits.</p>
                  {onBuyCredits ? (
                    <button
                      type="button"
                      onClick={onBuyCredits}
                      className="mt-2 text-indigo-700 underline"
                    >
                      Buy credits
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {!isLoading ? (
          <div className="shrink-0 border-t border-indigo-100 px-4 py-3">
            <p className="mb-2 text-center text-[11px] text-indigo-700/80">
              Generate 3 outfits · 1 credit
              {credits != null ? ` · You have ${credits}` : ""}
            </p>
            <button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {status === "error" ? "Try Again" : "Generate 3 Outfits"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
