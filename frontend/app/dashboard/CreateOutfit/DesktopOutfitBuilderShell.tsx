"use client";

import { ClothingItem, Slot } from "../../types/clothes";
import { OutfitRecommendation } from "../../types/aiStylist";
import BuilderOutfitPreview from "./BuilderOutfitPreview";
import DesktopPreviewCarousel from "./DesktopPreviewCarousel";
import AiLookActionBar from "./AiLookActionBar";
import BuilderSectionHeader from "./BuilderSectionHeader";
import { History, Sparkles } from "lucide-react";

type DesktopOutfitBuilderShellProps = {
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
  onOpenHistory: () => void;
  generationLabel: string | null;
  hasHistory: boolean;
  appliedConfirmation: string | null;
  isGenerating: boolean;
  panelHeightClass: string;
};

const PREVIEW_MIN_H = "min-h-[420px]";

export default function DesktopOutfitBuilderShell({
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
  onOpenHistory,
  generationLabel,
  hasHistory,
  appliedConfirmation,
  isGenerating,
  panelHeightClass,
}: DesktopOutfitBuilderShellProps) {
  const hasAiResults = recommendations.length > 0;
  const viewingAiLook = hasAiResults && activeGeneratedIndex > 0;
  const activeRecommendation = viewingAiLook
    ? recommendations[activeGeneratedIndex - 1] ?? null
    : null;

  return (
    <div
      id="builder-panel-preview"
      className={`flex min-h-0 flex-col rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-sm backdrop-blur ${panelHeightClass}`}
    >
      <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
        <BuilderSectionHeader
          step="02"
          title={hasAiResults ? "Your looks" : "Outfit Preview"}
          action={
            <span className="inline-flex min-h-8 items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-800">
              {hasAiResults
                ? "Use arrows to browse AI looks"
                : `${filledSlotCount} of 4 pieces`}
            </span>
          }
        />
        <div className="flex shrink-0 items-center gap-2">
          {hasHistory ? (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
            >
              <History className="h-3.5 w-3.5" aria-hidden />
              {generationLabel || "History"}
            </button>
          ) : null}
          <button
            type="button"
            id="desktop-ai-stylist-btn"
            onClick={onOpenAI}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {hasAiResults ? "Generate more" : "AI Stylist"}
          </button>
        </div>
      </div>

      <div
        className={`relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl ${PREVIEW_MIN_H}`}
      >
        {isGenerating && !hasAiResults ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/80 text-center backdrop-blur-[1px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            <p className="text-sm font-medium text-indigo-900">
              Almaari is styling your look…
            </p>
          </div>
        ) : null}

        {hasAiResults ? (
          <DesktopPreviewCarousel
            currentSlots={selectedBySlot}
            setCurrentSlots={setSelectedBySlot}
            recommendations={recommendations}
            clothesById={clothesById}
            activeIndex={activeGeneratedIndex}
            onActiveIndexChange={onActiveGeneratedIndexChange}
            anchoredItemIds={anchoredItemIds}
            onToggleAnchor={onToggleAnchor}
            onRemoveItem={onRemoveItem}
            onAnchorAllPreview={onAnchorAllPreview}
            swapMode={swapMode}
            swapTargetSlot={swapTargetSlot}
            onReplaceSlot={(slot) => onReplaceSlot(slot)}
            previewHighlight={previewHighlight}
            dotsBottomClass={viewingAiLook ? "bottom-12" : "bottom-3"}
          />
        ) : (
          <BuilderOutfitPreview
            selectedBySlot={selectedBySlot}
            setSelectedBySlot={setSelectedBySlot}
            swapMode={swapMode}
            swapTargetSlot={swapTargetSlot}
            onReplaceSlot={(slot) => onReplaceSlot(slot)}
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
            className="absolute left-3 right-3 top-14 z-20 rounded-xl border border-indigo-200 bg-white/95 px-3 py-2 text-xs font-medium text-indigo-900 shadow-sm backdrop-blur-sm"
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
    </div>
  );
}
