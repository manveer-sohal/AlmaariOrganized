"use client";

import { useCallback } from "react";
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
import { Anchor, CloudSun, Snowflake, Sun, X } from "lucide-react";
import { useOverlayFocus } from "./useOverlayFocus";

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

const WEATHER_META: Record<
  StylistWeather,
  { label: string; Icon: typeof Sun }
> = {
  Warm: { label: "Warm", Icon: Sun },
  Mild: { label: "Mild", Icon: CloudSun },
  Cold: { label: "Cold", Icon: Snowflake },
};

function pillClass(active: boolean) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition ${
    active
      ? "bg-indigo-600 text-white"
      : "bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
  }`;
}

export type AIStylistSidebarProps = {
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

export default function AIStylistSidebar({
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
}: AIStylistSidebarProps) {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const containerRef = useOverlayFocus(open, handleClose);
  const modeMeta = STYLIST_MODE_META[mode];
  const hasCredits = credits == null || credits >= 1;
  const isLoading = status === "loading";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 hidden md:block">
      <button
        type="button"
        className="absolute inset-0 bg-indigo-950/30 backdrop-blur-[1px]"
        aria-label="Close AI stylist"
        onClick={handleClose}
      />
      <div
        ref={containerRef}
        id="desktop-ai-stylist-sidebar"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-sidebar-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-indigo-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-indigo-100 px-5 py-4">
          <div>
            <h2
              id="ai-sidebar-title"
              className="text-lg font-semibold text-indigo-900"
            >
              AI Stylist
            </h2>
            <p className="mt-0.5 text-xs text-indigo-700/75">
              {hasHistory ? "Refine or generate a new set" : "What are you dressing for?"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-200 text-indigo-800 hover:bg-indigo-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {clothesCount === 0 ? (
          <div className="flex flex-1 flex-col px-5 py-6">
            <p className="text-sm text-indigo-700/80">
              Add clothes to your wardrobe before generating an outfit.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-4 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-900"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {isLoading ? (
                <div className="space-y-3 py-8 text-center" aria-live="polite">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                  <p className="text-sm font-medium text-indigo-900">
                    {refinementPrompt.trim()
                      ? "Creating new looks…"
                      : modeMeta.loading}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700/70">
                      Occasion
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {OCCASIONS.map((option) => {
                        const active = preferences.occasion === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              onPreferencesChange({
                                ...preferences,
                                occasion: option,
                              })
                            }
                            className={pillClass(active)}
                          >
                            {option === "Party" ? "Event" : option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700/70">
                      Weather
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {WEATHER_OPTIONS.map((option) => {
                        const active = preferences.weather === option;
                        const { label, Icon } = WEATHER_META[option];
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              onPreferencesChange({
                                ...preferences,
                                weather: option,
                              })
                            }
                            className={`inline-flex items-center gap-1.5 ${pillClass(active)}`}
                          >
                            <Icon className="h-4 w-4 shrink-0" aria-hidden />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700/70">
                      Style
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {STYLE_OPTIONS.map((option) => {
                        const active = preferences.style === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              onPreferencesChange({
                                ...preferences,
                                style: option,
                              })
                            }
                            className={pillClass(active)}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700/70">
                      Mode
                    </p>
                    <div
                      role="tablist"
                      aria-label="Stylist mode"
                      className="grid grid-cols-2 gap-1.5"
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
                            className={`rounded-xl border px-2 py-2 text-left text-[11px] font-semibold leading-snug ${
                              active
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-indigo-200 bg-white text-indigo-900 hover:bg-indigo-50"
                            }`}
                          >
                            {STYLIST_MODE_META[option].label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-indigo-700/75">
                      {modeMeta.description}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700/70">
                      Avoid
                    </p>
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
                      className="w-full rounded-xl border border-indigo-200 px-3 py-2.5 text-sm text-indigo-900 placeholder:text-indigo-400"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700/70">
                        Anchored pieces
                      </p>
                      {onAnchorAllPreview && canAnchorAll ? (
                        <button
                          type="button"
                          onClick={onAnchorAllPreview}
                          className="text-[11px] font-semibold text-indigo-600"
                        >
                          Anchor all in preview
                        </button>
                      ) : null}
                    </div>
                    {anchoredItems.length === 0 ? (
                      <p className="mt-1 text-[11px] text-indigo-700/70">
                        Anchor items from the wardrobe to lock them in.
                      </p>
                    ) : (
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {anchoredItems.map((item) => (
                          <div
                            key={item._id}
                            className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 py-1 pl-1 pr-2"
                          >
                            <div className="relative h-6 w-6 overflow-hidden rounded-full bg-white">
                              <Image
                                src={item.imageSrc}
                                alt={humanizeClothingSubtype(item)}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <Anchor className="h-3 w-3" aria-hidden />
                            <span className="max-w-[7rem] truncate text-[11px] font-medium">
                              {humanizeClothingSubtype(item)}
                            </span>
                            {onUnanchorItem ? (
                              <button
                                type="button"
                                aria-label={`Unanchor ${humanizeClothingSubtype(item)}`}
                                onClick={() => onUnanchorItem(item._id)}
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
                    <div className="rounded-xl bg-indigo-50/80 p-3">
                      <p className="text-xs font-semibold text-indigo-900">
                        Refine (optional)
                      </p>
                      <p className="mt-1 text-[11px] text-indigo-700/75">
                        Add a note, or generate another set below.
                      </p>
                      <textarea
                        value={refinementPrompt}
                        onChange={(e) => onRefinementPromptChange(e.target.value)}
                        rows={2}
                        placeholder="Make warmer, more formal…"
                        className="mt-2 w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={onRefine}
                        disabled={!canGenerate || !refinementPrompt.trim()}
                        className="mt-2 w-full rounded-xl border border-indigo-200 bg-white py-2.5 text-sm font-semibold text-indigo-900 disabled:opacity-60"
                      >
                        Generate with note
                      </button>
                    </div>
                  ) : null}

                  {status === "error" ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-700">
                        We couldn&apos;t generate outfits.
                      </p>
                      <p className="mt-1 text-sm text-indigo-900">
                        {errorMessage || "Something went wrong."}
                      </p>
                      {(errorCode === "INSUFFICIENT_WARDROBE" ||
                        errorCode === "EMPTY_WARDROBE") && (
                        <p className="mt-1 text-sm text-indigo-700/75">
                          Add a top, bottom, and shoes (or a dress and shoes).
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
                          className="mt-2 font-semibold text-indigo-600 underline"
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
              <div className="shrink-0 border-t border-indigo-100 px-5 py-4">
                <p className="mb-2 text-center text-[11px] text-indigo-700/75">
                  3 looks · 1 credit
                  {credits != null ? ` · You have ${credits}` : ""}
                </p>
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={!canGenerate}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {status === "error"
                    ? "Try again"
                    : hasHistory
                      ? "Get more looks"
                      : "Get looks"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
