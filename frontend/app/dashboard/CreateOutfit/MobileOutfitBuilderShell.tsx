"use client";

import { ClothingItem, Slot } from "../../types/clothes";
import { OutfitRecommendation } from "../../types/aiStylist";
import BuilderOutfitPreview from "./BuilderOutfitPreview";
import MobilePreviewCarousel from "./MobilePreviewCarousel";
import MobileSaveBar from "./MobileSaveBar";
import { Sparkles, Plus, History } from "lucide-react";

type MobileOutfitBuilderShellProps = {
  name: string;
  onNameChange: (value: string) => void;
  filledSlotCount: number;
  selectedBySlot: Partial<Record<Slot, ClothingItem[] | null>>;
  setSelectedBySlot: (
    updater: (
      prev: Partial<Record<Slot, ClothingItem[] | null>>,
    ) => Partial<Record<Slot, ClothingItem[] | null>>,
  ) => void;
  anchoredItemIds: string[];
  onToggleAnchor: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onAnchorAllPreview?: () => void;
  swapMode: boolean;
  swapTargetSlot: Slot | null;
  onReplaceSlot: (slot?: Slot) => void;
  previewHighlight: boolean;
  recommendations: OutfitRecommendation[];
  clothesById: Map<string, ClothingItem>;
  activeGeneratedIndex: number;
  onActiveGeneratedIndexChange: (index: number) => void;
  feedbackSubmitted: Record<string, "positive" | "negative">;
  onFeedback: (
    recommendation: OutfitRecommendation,
    rating: "positive" | "negative",
    reasons?: string[],
  ) => void;
  onUseOutfit: (recommendation: OutfitRecommendation) => void;
  onOpenAI: () => void;
  onOpenWardrobe: () => void;
  onOpenHistory: () => void;
  generationLabel: string | null;
  hasHistory: boolean;
  appliedConfirmation: string | null;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
};

export default function MobileOutfitBuilderShell({
  name,
  onNameChange,
  filledSlotCount,
  selectedBySlot,
  setSelectedBySlot,
  anchoredItemIds,
  onToggleAnchor,
  onRemoveItem,
  onAnchorAllPreview,
  swapMode,
  swapTargetSlot,
  onReplaceSlot,
  previewHighlight,
  recommendations,
  clothesById,
  activeGeneratedIndex,
  onActiveGeneratedIndexChange,
  feedbackSubmitted,
  onFeedback,
  onUseOutfit,
  onOpenAI,
  onOpenWardrobe,
  onOpenHistory,
  generationLabel,
  hasHistory,
  appliedConfirmation,
  saving,
  canSave,
  onSave,
}: MobileOutfitBuilderShellProps) {
  const hasAiResults = recommendations.length > 0;
  const isEmpty = filledSlotCount === 0 && !hasAiResults;
  const activeRecommendation = hasAiResults
    ? recommendations[activeGeneratedIndex] ?? recommendations[0]
    : null;

  // Bottom dock + fixed mobile tab bar (~4.25rem).
  const bottomPad = hasAiResults ? "pb-[18rem]" : "pb-32";

  return (
    <div
      id="mobile-outfit-builder"
      className={`md:hidden flex max-w-full flex-col overflow-x-hidden ${
        hasAiResults
          ? `h-full min-h-0 ${bottomPad}`
          : `${bottomPad}`
      }`}
    >
      <header className={`shrink-0 ${hasAiResults ? "mb-1.5" : "mb-3"}`}>
        {!hasAiResults ? (
          <>
            <h2 className="text-xl font-semibold text-indigo-900">
              Build an Outfit
            </h2>
            <p className="mt-1 text-sm text-indigo-700/75">
              Create a look manually or let Almaari style it.
            </p>
            <label className="mt-2 block">
              <span className="mb-1 block text-xs font-medium text-indigo-800">
                Outfit name (optional)
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Weekend Dinner"
                className="h-10 w-full rounded-xl border border-indigo-300 bg-white px-3 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </label>
          </>
        ) : null}

        <div className={`grid grid-cols-2 gap-2 ${hasAiResults ? "" : "mt-2"}`}>
          <button
            id="mobile-ai-style-btn"
            type="button"
            onClick={onOpenAI}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {hasAiResults ? "Refine" : "AI Style Me"}
          </button>
          <button
            id="mobile-add-clothes-btn"
            type="button"
            onClick={onOpenWardrobe}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 text-sm font-semibold text-indigo-900 hover:bg-indigo-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Clothes
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-indigo-700/80">
          <span>
            {hasAiResults
              ? "Swipe looks · Use below to apply"
              : `${filledSlotCount} of 4 pieces selected`}
          </span>
          {hasHistory ? (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1 font-semibold text-indigo-700 underline-offset-2 hover:underline"
            >
              <History className="h-3.5 w-3.5" aria-hidden />
              {generationLabel || "History"}
            </button>
          ) : null}
        </div>
      </header>

      {appliedConfirmation ? (
        <p
          role="status"
          aria-live="polite"
          className="mb-2 shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-800"
        >
          {appliedConfirmation}
        </p>
      ) : null}

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-indigo-300 bg-white/70 px-4 py-10 text-center">
          <p className="text-base font-semibold text-indigo-900">
            Start your outfit
          </p>
          <p className="mt-1 text-sm text-indigo-700/80">
            Add clothes manually or let Almaari create a look.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenAI}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white"
            >
              AI Style Me
            </button>
            <button
              type="button"
              onClick={onOpenWardrobe}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-300 bg-white px-4 text-sm font-semibold text-indigo-900"
            >
              Add Clothes
            </button>
          </div>
        </div>
      ) : hasAiResults ? (
        <div className="min-h-0 flex-1 overflow-hidden">
          <MobilePreviewCarousel
            recommendations={recommendations}
            clothesById={clothesById}
            activeIndex={activeGeneratedIndex}
            onActiveIndexChange={onActiveGeneratedIndexChange}
            anchoredItemIds={anchoredItemIds}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <BuilderOutfitPreview
            selectedBySlot={selectedBySlot}
            setSelectedBySlot={setSelectedBySlot}
            swapMode={swapMode}
            swapTargetSlot={swapTargetSlot}
            onReplaceSlot={onReplaceSlot}
            highlightApplied={previewHighlight}
            anchoredItemIds={anchoredItemIds}
            onToggleAnchor={onToggleAnchor}
            onRemoveItem={onRemoveItem}
            onAnchorAllPreview={onAnchorAllPreview}
            className="min-h-[380px]"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenWardrobe}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-indigo-300 bg-white px-3 text-sm font-semibold text-indigo-900"
            >
              Edit Pieces
            </button>
            <button
              type="button"
              onClick={onOpenAI}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-indigo-400 bg-indigo-50 px-3 text-sm font-semibold text-indigo-900"
            >
              AI Style Me
            </button>
          </div>
        </div>
      )}

      <MobileSaveBar
        selectedCount={filledSlotCount}
        saving={saving}
        canSave={canSave}
        onSave={onSave}
        outfitPosition={
          hasAiResults
            ? {
                current: activeGeneratedIndex + 1,
                total: recommendations.length,
              }
            : null
        }
        activeRecommendation={activeRecommendation}
        feedbackSubmitted={feedbackSubmitted}
        onFeedback={onFeedback}
        onUseOutfit={onUseOutfit}
        name={hasAiResults ? name : undefined}
        onNameChange={hasAiResults ? onNameChange : undefined}
      />
    </div>
  );
}
