"use client";

import { useMemo } from "react";
import { ClothingItem, Slot } from "../../types/clothes";
import { OutfitRecommendation } from "../../types/aiStylist";
import BuilderOutfitPreview from "./BuilderOutfitPreview";
import MobilePreviewCarousel from "./MobilePreviewCarousel";
import MobileSaveBar from "./MobileSaveBar";
import { History, Sparkles } from "lucide-react";

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
  /** Bumped when Use Outfit applies — forces smooth scroll back to your look. */
  carouselReturnNonce?: number;
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
  carouselReturnNonce = 0,
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
  const onBuilderSlide = !hasAiResults || activeGeneratedIndex === 0;
  const viewingAiLook = hasAiResults && activeGeneratedIndex > 0;
  const activeRecommendation = viewingAiLook
    ? recommendations[activeGeneratedIndex - 1] ?? null
    : null;

  const orderedExplanations = useMemo(() => {
    const entries = recommendations.map((recommendation, index) => ({
      recommendation,
      lookNumber: index + 1,
      slideIndex: index + 1,
    }));
    if (!viewingAiLook || !activeRecommendation) return entries;

    const active = entries.find(
      (entry) => entry.recommendation.id === activeRecommendation.id,
    );
    if (!active) return entries;
    return [
      active,
      ...entries.filter(
        (entry) => entry.recommendation.id !== activeRecommendation.id,
      ),
    ];
  }, [recommendations, viewingAiLook, activeRecommendation]);

  // Bottom dock + fixed mobile tab bar (~4.25rem).
  const bottomPad = viewingAiLook
    ? "pb-[14rem]"
    : hasAiResults
      ? "pb-40"
      : "pb-32";

  return (
    <div
      id="mobile-outfit-builder"
      className={`md:hidden flex max-w-full flex-col overflow-x-hidden ${bottomPad}`}
    >
      <header className={`shrink-0 ${hasAiResults ? "mb-1.5" : "mb-3"}`}>
        {!hasAiResults ? (
          <>
            <h2 className="font-display text-xl text-almaari-ink">Create</h2>
            <p className="mt-1 text-sm text-almaari-muted">
              Ask Almaari or build a look yourself.
            </p>
            <label className="mt-2 block">
              <span className="mb-1 block text-xs font-medium text-almaari-muted">
                Outfit name (optional)
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Weekend dinner"
                className="h-10 w-full rounded-almaari border border-almaari-border bg-almaari-surface-raised px-3 text-sm text-almaari-ink focus:outline-none focus:ring-2 focus:ring-almaari-accent/30"
              />
            </label>
          </>
        ) : null}

        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-almaari-muted">
          <span>
            {hasAiResults
              ? "Swipe left for AI looks · Use to apply"
              : `${filledSlotCount} of 4 pieces selected`}
          </span>
          {hasHistory ? (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1 font-semibold text-almaari-accent underline-offset-2 hover:underline"
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
          className="mb-2 shrink-0 rounded-xl border border-almaari-border bg-almaari-accent-soft px-3 py-2 text-xs font-medium text-almaari-ink"
        >
          {appliedConfirmation}
        </p>
      ) : null}

      {hasAiResults ? (
        <div className="h-[min(480px,62vh)] shrink-0 overflow-hidden">
          <MobilePreviewCarousel
            currentSlots={selectedBySlot}
            setCurrentSlots={setSelectedBySlot}
            recommendations={recommendations}
            clothesById={clothesById}
            activeIndex={activeGeneratedIndex}
            onActiveIndexChange={onActiveGeneratedIndexChange}
            scrollReturnNonce={carouselReturnNonce}
            anchoredItemIds={anchoredItemIds}
            onToggleAnchor={onToggleAnchor}
            onRemoveItem={onRemoveItem}
            onAnchorAllPreview={onAnchorAllPreview}
            swapMode={swapMode}
            swapTargetSlot={swapTargetSlot}
            onReplaceSlot={onReplaceSlot}
            previewHighlight={previewHighlight}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="relative mx-auto aspect-[3/4] w-[min(320px,86vw)] overflow-hidden">
            <div className="absolute inset-0">
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
                compact
                className="h-full w-full border-0 bg-transparent p-0 shadow-none"
              />
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenWardrobe}
              className="inline-flex min-h-10 items-center justify-center rounded-almaari border border-almaari-border bg-almaari-surface-raised px-3 text-sm font-semibold text-almaari-ink"
            >
              Edit pieces
            </button>
            <button
              type="button"
              onClick={onOpenAI}
              className="inline-flex min-h-10 items-center justify-center rounded-almaari bg-almaari-accent-soft px-3 text-sm font-semibold text-almaari-ink"
            >
              Ask stylist
            </button>
          </div>
        </div>
      )}

      {hasAiResults ? (
        <div className="mt-3 grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenWardrobe}
            className="inline-flex min-h-10 items-center justify-center rounded-almaari border border-almaari-border bg-almaari-surface-raised px-3 text-sm font-semibold text-almaari-ink"
          >
            Edit pieces
          </button>
          <button
            type="button"
            onClick={onOpenAI}
            className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-almaari bg-almaari-accent px-3 text-sm font-semibold text-white"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Generate more
          </button>
        </div>
      ) : null}
      {hasAiResults ? (
        <section className="mt-5 space-y-3" aria-label="Look explanations">
          <h3 className="font-display text-lg text-almaari-ink">
            Why these looks
          </h3>
          <ul className="space-y-3">
            {orderedExplanations.map(
              ({ recommendation, lookNumber, slideIndex }) => {
                const isActive = activeGeneratedIndex === slideIndex;
                return (
                  <li key={recommendation.id}>
                    <button
                      type="button"
                      onClick={() => onActiveGeneratedIndexChange(slideIndex)}
                      className={`w-full rounded-almaari border px-3.5 py-3 text-left transition ${
                        isActive
                          ? "border-almaari-accent bg-almaari-accent-soft shadow-sm"
                          : "border-almaari-border bg-almaari-surface-raised"
                      }`}
                    >
                      <p className="text-sm font-semibold text-almaari-ink">
                        Look {lookNumber}
                        {recommendation.name
                          ? ` · ${recommendation.name}`
                          : ""}
                        {recommendation.label ? (
                          <span className="font-medium text-almaari-muted">
                            {" "}
                            · {recommendation.label}
                          </span>
                        ) : null}
                      </p>
                      {recommendation.explanation ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-almaari-muted">
                          {recommendation.explanation}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-sm text-almaari-muted">
                          No explanation for this look.
                        </p>
                      )}
                    </button>
                  </li>
                );
              },
            )}
          </ul>
        </section>
      ) : null}

      <MobileSaveBar
        selectedCount={filledSlotCount}
        saving={saving}
        canSave={canSave}
        onSave={onSave}
        showSaveControls={onBuilderSlide}
        activeRecommendation={activeRecommendation}
        feedbackSubmitted={feedbackSubmitted}
        onFeedback={onFeedback}
        onUseOutfit={onUseOutfit}
        name={hasAiResults && onBuilderSlide ? name : undefined}
        onNameChange={hasAiResults && onBuilderSlide ? onNameChange : undefined}
      />
    </div>
  );
}
