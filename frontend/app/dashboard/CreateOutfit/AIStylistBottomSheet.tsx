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
import { Anchor, CloudSun, Snowflake, Sun } from "lucide-react";
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
  return `min-h-10 rounded-full px-4 text-sm font-semibold transition ${
    active
      ? "bg-almaari-accent text-white"
      : "bg-almaari-accent-soft text-almaari-ink"
  }`;
}

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
          className="absolute inset-0 bg-almaari-ink/40"
          aria-label="Close"
          onClick={handleClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-sheet-title"
          className="absolute inset-x-0 bottom-0 max-h-[90vh] rounded-t-almaari-lg border border-almaari-border bg-almaari-surface-raised p-4 shadow-soft"
        >
          <h2
            id="ai-sheet-title"
            className="font-display text-lg text-almaari-ink"
          >
            Stylist
          </h2>
          <p className="mt-2 text-sm text-almaari-muted">
            Add clothes to your wardrobe before generating an outfit.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="mt-4 min-h-touch w-full rounded-almaari border border-almaari-border px-4 text-sm font-semibold"
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
        className="absolute inset-0 bg-almaari-ink/40"
        aria-label="Close stylist"
        onClick={handleClose}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-sheet-title"
        className="absolute inset-x-0 bottom-0 flex max-h-[92vh] flex-col rounded-t-almaari-lg border border-almaari-border bg-almaari-surface-raised shadow-soft"
        style={{ paddingBottom: "max(0.5rem, var(--safe-bottom))" }}
      >
        <div className="flex shrink-0 flex-col items-center pt-2">
          <div
            className="h-1.5 w-10 rounded-full bg-almaari-border"
            aria-hidden
          />
          <div className="mt-2 flex w-full items-start justify-between gap-3 px-4">
            <div>
              <h2
                id="ai-sheet-title"
                className="font-display text-lg text-almaari-ink"
              >
                What are you dressing for?
              </h2>
              <p className="mt-0.5 text-xs text-almaari-muted">
                {hasHistory ? "Refine or generate a new set" : "Quick start"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="min-h-11 rounded-xl border border-almaari-border px-3 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-3">
          {isLoading ? (
            <div className="space-y-3 py-6 text-center" aria-live="polite">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-almaari-accent-soft border-t-almaari-accent" />
              <p className="text-sm font-medium text-almaari-ink">
                {refinementPrompt.trim()
                  ? "Creating new looks…"
                  : modeMeta.loading}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-almaari-muted">
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
                <p className="mb-1.5 text-xs font-semibold text-almaari-muted">
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
                <p className="mb-1.5 text-xs font-semibold text-almaari-muted">
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
                <p className="text-[11px] font-semibold uppercase tracking-wide text-almaari-muted">
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
                            ? "border-almaari-accent bg-almaari-accent text-white"
                            : "border-almaari-border bg-white text-almaari-ink"
                        }`}
                      >
                        {STYLIST_MODE_META[option].label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-almaari-muted">
                  {modeMeta.description}
                </p>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold text-almaari-muted">
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
                  className="min-h-11 w-full rounded-xl border border-almaari-border px-3 py-2 text-sm text-almaari-ink placeholder:text-almaari-muted"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-almaari-muted">
                    Anchored pieces
                  </p>
                  {onAnchorAllPreview && canAnchorAll ? (
                    <button
                      type="button"
                      onClick={onAnchorAllPreview}
                      className="text-[11px] font-semibold text-almaari-accent"
                    >
                      Anchor all in preview
                    </button>
                  ) : null}
                </div>
                {anchoredItems.length === 0 ? (
                  <p className="mt-1 text-[11px] text-almaari-muted">
                    Anchor items from the wardrobe to lock them in.
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {anchoredItems.map((item) => (
                      <div
                        key={item._id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-almaari-accent-soft py-1 pl-1 pr-2"
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
                <div className="rounded-almaari bg-almaari-warm p-3">
                  <p className="text-xs font-semibold text-almaari-ink">
                    Refine (optional)
                  </p>
                  <p className="mt-1 text-[11px] text-almaari-muted">
                    Add a note, or tap Get more looks below for another set.
                  </p>
                  <textarea
                    value={refinementPrompt}
                    onChange={(e) => onRefinementPromptChange(e.target.value)}
                    rows={2}
                    placeholder="Make warmer, more formal…"
                    className="mt-2 w-full rounded-xl border border-almaari-border bg-white px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={onRefine}
                    disabled={!canGenerate || !refinementPrompt.trim()}
                    className="mt-2 min-h-touch w-full rounded-almaari border border-almaari-border bg-almaari-surface-raised text-sm font-semibold text-almaari-ink disabled:opacity-60"
                  >
                    Generate with note
                  </button>
                </div>
              ) : null}

              {status === "error" ? (
                <div className="rounded-almaari border border-red-200 bg-red-50 p-3">
                  <p className="text-sm font-medium text-red-700">
                    We couldn’t generate outfits.
                  </p>
                  <p className="mt-1 text-sm text-almaari-ink">
                    {errorMessage || "Something went wrong."}
                  </p>
                  {(errorCode === "INSUFFICIENT_WARDROBE" ||
                    errorCode === "EMPTY_WARDROBE") && (
                    <p className="mt-1 text-sm text-almaari-muted">
                      Add a top, bottom, and shoes (or a dress and shoes).
                    </p>
                  )}
                </div>
              ) : null}

              {!hasCredits ? (
                <div className="rounded-almaari border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p>You need at least 1 credit to generate outfits.</p>
                  {onBuyCredits ? (
                    <button
                      type="button"
                      onClick={onBuyCredits}
                      className="mt-2 font-semibold text-almaari-accent underline"
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
          <div className="shrink-0 border-t border-almaari-border/60 px-4 py-3">
            <p className="mb-2 text-center text-[11px] text-almaari-muted">
              3 looks · 1 credit
              {credits != null ? ` · You have ${credits}` : ""}
            </p>
            <button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="min-h-touch w-full rounded-almaari bg-almaari-accent text-sm font-semibold text-white hover:bg-almaari-accent-strong disabled:opacity-60"
            >
              {status === "error"
                ? "Try again"
                : hasHistory
                  ? "Get more looks"
                  : "Get looks"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
