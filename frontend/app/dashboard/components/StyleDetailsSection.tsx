"use client";

import { useState } from "react";
import {
  occasionTags_List,
  styleCategories_List,
} from "../../data/constants";
import {
  EnrichmentStatus,
  OccasionTag,
  StyleCategory,
} from "../../types/clothes";

export type StyleDetailsValue = {
  styleCategory: StyleCategory | null;
  occasionTags: OccasionTag[];
};

type StyleDetailsSectionProps = {
  value: StyleDetailsValue;
  onChange: (next: StyleDetailsValue) => void;
  enrichmentStatus?: EnrichmentStatus | null;
  userReviewedAt?: string | null;
  defaultOpen?: boolean;
};

function enrichmentLabel(status?: EnrichmentStatus | null) {
  if (status === "pending" || status === "processing") {
    return "Analyzing style…";
  }
  if (status === "completed") return "Style details ready";
  if (status === "failed") return "Style analysis unavailable";
  return null;
}

export default function StyleDetailsSection({
  value,
  onChange,
  enrichmentStatus,
  userReviewedAt,
  defaultOpen = false,
}: StyleDetailsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const statusText = enrichmentLabel(enrichmentStatus);
  const showAiSuggested =
    Boolean(enrichmentStatus === "completed") && !userReviewedAt;

  const toggleCategory = (category: StyleCategory) => {
    onChange({
      ...value,
      styleCategory: value.styleCategory === category ? null : category,
    });
  };

  const toggleOccasion = (tag: OccasionTag) => {
    const exists = value.occasionTags.includes(tag);
    onChange({
      ...value,
      occasionTags: exists
        ? value.occasionTags.filter((item) => item !== tag)
        : [...value.occasionTags, tag],
    });
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-white/70">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-indigo-800"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>Edit style details</span>
        <span className="text-indigo-500">{open ? "−" : "+"}</span>
      </button>

      {statusText && (
        <p className="px-3 pb-2 text-xs text-indigo-600/80">{statusText}</p>
      )}

      {open && (
        <div className="space-y-4 border-t border-indigo-100 px-3 py-3">
          {showAiSuggested && (
            <p className="text-xs text-indigo-600">AI suggested</p>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-indigo-700">Style category</p>
            <div className="flex flex-wrap gap-2">
              {styleCategories_List.map((category) => {
                const selected = value.styleCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selected
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-indigo-700">Occasion tags</p>
            <div className="flex flex-wrap gap-2">
              {occasionTags_List.map((tag) => {
                const selected = value.occasionTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleOccasion(tag)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selected
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
