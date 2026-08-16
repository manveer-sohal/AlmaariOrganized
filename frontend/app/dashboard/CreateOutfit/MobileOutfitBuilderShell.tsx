"use client";

import { ClothingItem, Slot } from "../../types/clothes";
import { OutfitRecommendation } from "../../types/aiStylist";
import BuilderOutfitPreview from "./BuilderOutfitPreview";
import MobilePreviewCarousel from "./MobilePreviewCarousel";
import AiLookActionBar from "./AiLookActionBar";
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
  flashCarouselNext?: boolean;
  onDismissCarouselNextHint?: () => void;
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
  flashCarouselNext = false,
  onDismissCarouselNextHint,
}: MobileOutfitBuilderShellProps) {
  const hasAiResults = recommendations.length > 0;
  const onBuilderSlide = !hasAiResults || activeGeneratedIndex === 0;
  const viewingAiLook = hasAiResults && activeGeneratedIndex > 0;
  const activeRecommendation = viewingAiLook
    ? recommendations[activeGeneratedIndex - 1] ?? null
    : null;

  return (
    <div
      id="mobile-outfit-builder"
      className="md:hidden flex min-h-[calc(100dvh-var(--nav-height)-var(--safe-bottom)-1.5rem)] flex-1 flex-col overflow-hidden"
    >
      <header className={`shrink-0 ${hasAiResults ? "mb-1" : "mb-2"}`}>
        {!hasAiResults ? (
          <>
            <h2 className="font-display text-xl text-almaari-ink">Create</h2>
            <p className="mt-1 text-sm text-almaari-muted">
              Ask Almaari or build a look yourself.
            </p>
          </>
        ) : null}

        {onBuilderSlide ? (
          <label className={`block ${hasAiResults ? "" : "mt-2"}`}>
            <span className="mb-1 block text-xs font-medium text-almaari-muted">
              Outfit name (optional)
            </span>
            <div className="flex items-center gap-2">
              <input
                id="create-outfit-form-name"
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Weekend dinner"
                className="h-10 min-w-0 flex-1 rounded-almaari border border-almaari-border bg-almaari-surface-raised px-3 text-sm text-almaari-ink focus:outline-none focus:ring-2 focus:ring-almaari-accent/30"
              />
              <button
                id="mobile-save-outfit-btn"
                type="button"
                disabled={saving || !canSave}
                onClick={onSave}
                aria-label={saving ? "Saving outfit" : "Save outfit"}
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-almaari bg-almaari-accent px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </label>
        ) : null}

        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-almaari-muted">
          <span>
            {hasAiResults
              ? "Swipe for AI looks · Use to apply"
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

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-almaari-lg">
        {hasAiResults ? (
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
            dotsBottomClass={viewingAiLook ? "bottom-11" : "bottom-3"}
            flashNextArrow={flashCarouselNext}
            onDismissNextHint={onDismissCarouselNextHint}
          />
        ) : (
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
        )}

        {appliedConfirmation ? (
          <p
            role="status"
            aria-live="polite"
            className="absolute left-3 right-3 top-12 z-20 rounded-xl border border-almaari-border bg-white/95 px-3 py-2 text-xs font-medium text-almaari-ink shadow-sm backdrop-blur-sm"
          >
            {appliedConfirmation}
          </p>
        ) : null}

        {viewingAiLook && activeRecommendation ? (
          <AiLookActionBar
            recommendation={activeRecommendation}
            feedbackSubmitted={feedbackSubmitted}
            onUseOutfit={onUseOutfit}
            onFeedback={onFeedback}
          />
        ) : null}
      </div>

      <div className="mt-2 shrink-0 grid w-full grid-cols-2 gap-2">
        <button
          id="mobile-edit-pieces-btn"
          type="button"
          onClick={onOpenWardrobe}
          className="inline-flex min-h-10 items-center justify-center rounded-almaari border border-almaari-border bg-almaari-surface-raised px-3 text-sm font-semibold text-almaari-ink"
        >
          Edit pieces
        </button>
        <button
          id="mobile-ask-stylist-btn"
          type="button"
          onClick={onOpenAI}
          className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-almaari px-3 text-sm font-semibold ${
            hasAiResults
              ? "bg-almaari-accent text-white"
              : "bg-almaari-accent-soft text-almaari-ink"
          }`}
        >
          {hasAiResults ? (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              Generate more
            </>
          ) : (
            "Ask stylist"
          )}
        </button>
      </div>
    </div>
  );
}
