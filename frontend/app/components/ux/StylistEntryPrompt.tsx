"use client";

import { StylistOccasion } from "../../types/aiStylist";
import EmptyState from "./EmptyState";

const QUICK_OCCASIONS: { label: string; value: StylistOccasion }[] = [
  { label: "Everyday", value: "Everyday" },
  { label: "Work", value: "Work" },
  { label: "Dinner", value: "Dinner" },
  { label: "Event", value: "Party" },
  { label: "Travel", value: "Other" },
];

type StylistEntryPromptProps = {
  onSelectOccasion: (occasion: StylistOccasion) => void;
  onSkip: () => void;
  emptyWardrobe?: boolean;
  onAddClothes?: () => void;
};

export default function StylistEntryPrompt({
  onSelectOccasion,
  onSkip,
  emptyWardrobe,
  onAddClothes,
}: StylistEntryPromptProps) {
  if (emptyWardrobe) {
    return (
      <EmptyState
        title="Tell Almaari what you’re dressing for."
        actionLabel="Add clothes first"
        onAction={onAddClothes}
        className="min-h-[60vh]"
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col justify-center px-4 py-8">
      <h1 className="text-center font-display text-3xl text-almaari-ink">
        What are you dressing for?
      </h1>
      <p className="mt-2 text-center text-sm text-almaari-muted">
        Pick one to start — you can refine next.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {QUICK_OCCASIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onSelectOccasion(opt.value)}
            className="inline-flex min-h-touch min-w-[6.5rem] items-center justify-center rounded-full bg-almaari-accent-soft px-5 text-sm font-semibold text-almaari-ink transition-transform active:scale-[0.98] hover:bg-almaari-chrome/60"
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-8 text-sm font-semibold text-almaari-muted underline-offset-2 hover:text-almaari-ink hover:underline"
      >
        Open outfit builder
      </button>
    </div>
  );
}
