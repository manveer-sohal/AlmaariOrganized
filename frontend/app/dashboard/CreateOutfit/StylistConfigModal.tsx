"use client";

import {
  DEFAULT_STYLIST_PREFERENCES,
  StylistOccasion,
  StylistPreferences,
  StylistStyle,
  StylistWeather,
} from "../../types/aiStylist";

type StylistConfigModalProps = {
  open: boolean;
  preferences: StylistPreferences;
  onChange: (preferences: StylistPreferences) => void;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  credits?: number;
};

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

export default function StylistConfigModal({
  open,
  preferences,
  onChange,
  onClose,
  onSubmit,
  isSubmitting,
  credits,
}: StylistConfigModalProps) {
  if (!open) return null;

  const hasCredits = credits == null || credits >= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-indigo-200 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-indigo-900">
              Generate outfits
            </h3>
            <p className="mt-1 text-sm text-indigo-700/80">
              Almaari will build three complete looks from your wardrobe.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-indigo-200 px-2 py-1 text-sm text-indigo-700"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4">
          <label className="grid gap-1 text-sm text-indigo-900">
            Occasion
            <select
              value={preferences.occasion}
              onChange={(e) =>
                onChange({
                  ...preferences,
                  occasion: e.target.value as StylistOccasion,
                })
              }
              className="rounded-xl border border-indigo-200 px-3 py-2"
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
                onChange({
                  ...preferences,
                  weather: e.target.value as StylistWeather,
                })
              }
              className="rounded-xl border border-indigo-200 px-3 py-2"
            >
              {WEATHER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-indigo-900">
            Style
            <select
              value={preferences.style}
              onChange={(e) =>
                onChange({
                  ...preferences,
                  style: e.target.value as StylistStyle,
                })
              }
              className="rounded-xl border border-indigo-200 px-3 py-2"
            >
              {STYLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm text-indigo-900">
            Anything you want to avoid?
            <input
              type="text"
              value={preferences.avoid}
              onChange={(e) =>
                onChange({ ...preferences, avoid: e.target.value })
              }
              placeholder="e.g. No heavy jackets"
              className="rounded-xl border border-indigo-200 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-indigo-700/80">
            Generate 3 outfits · 1 credit
            {credits != null ? ` · You have ${credits}` : ""}
          </p>
          <button
            type="button"
            disabled={isSubmitting || !hasCredits}
            onClick={onSubmit}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting ? "Generating..." : "Generate 3 outfits"}
          </button>
        </div>

        {!hasCredits && (
          <p className="mt-2 text-sm text-amber-700">
            You need at least 1 credit to generate outfits.
          </p>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_STYLIST_PREFERENCES };
