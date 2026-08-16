"use client";

import { useMemo } from "react";
import { ClothingItem, Slot } from "../../types/clothes";
import { OutfitRecommendation } from "../../types/aiStylist";
import BuilderOutfitPreview from "./BuilderOutfitPreview";
import { recommendationToSlots } from "./MobilePreviewCarousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DesktopPreviewCarouselProps = {
  currentSlots: Partial<Record<Slot, ClothingItem[] | null>>;
  setCurrentSlots: (
    updater: (
      prev: Partial<Record<Slot, ClothingItem[] | null>>,
    ) => Partial<Record<Slot, ClothingItem[] | null>>,
  ) => void;
  recommendations: OutfitRecommendation[];
  clothesById: Map<string, ClothingItem>;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  anchoredItemIds?: string[];
  onToggleAnchor?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
  onAnchorAllPreview?: () => void;
  swapMode?: boolean;
  swapTargetSlot?: Slot | null;
  onReplaceSlot?: (slot: Slot) => void;
  previewHighlight?: boolean;
  /** Extra bottom inset for slide dots when a parent overlay sits below them. */
  dotsBottomClass?: string;
  /** Pulse the next-arrow control after AI looks are generated. */
  flashNextArrow?: boolean;
  onDismissNextHint?: () => void;
};

/**
 * Desktop outfit carousel: [Your look] · [AI 1] · [AI 2] · [AI 3]
 * Controls overlay the preview — layout size stays fixed.
 */
export default function DesktopPreviewCarousel({
  currentSlots,
  setCurrentSlots,
  recommendations,
  clothesById,
  activeIndex,
  onActiveIndexChange,
  anchoredItemIds = [],
  onToggleAnchor,
  onRemoveItem,
  onAnchorAllPreview,
  swapMode = false,
  swapTargetSlot = null,
  onReplaceSlot,
  previewHighlight = false,
  dotsBottomClass = "bottom-3",
  flashNextArrow = false,
  onDismissNextHint,
}: DesktopPreviewCarouselProps) {
  const totalSlides = 1 + recommendations.length;

  const aiSlides = useMemo(
    () =>
      recommendations.map((rec) => ({
        recommendation: rec,
        slots: recommendationToSlots(rec, clothesById),
      })),
    [recommendations, clothesById],
  );

  const onCurrentSlide = activeIndex === 0;
  const activeAi =
    activeIndex > 0 ? aiSlides[activeIndex - 1]?.recommendation : null;

  const go = (delta: number) => {
    if (delta > 0 && flashNextArrow) onDismissNextHint?.();
    onActiveIndexChange(
      Math.min(totalSlides - 1, Math.max(0, activeIndex + delta)),
    );
  };

  const showNextHint =
    flashNextArrow && activeIndex === 0 && totalSlides > 1;

  const headerLabel = onCurrentSlide
    ? "Your look"
    : `Look ${activeIndex} of ${recommendations.length}`;

  const activeSlots = onCurrentSlide
    ? currentSlots
    : aiSlides[activeIndex - 1]?.slots ?? emptySlots();

  return (
    <section
      aria-label="Outfit previews"
      className="relative h-full min-h-0 w-full overflow-hidden"
    >
      <div className="absolute inset-0">
        <BuilderOutfitPreview
          selectedBySlot={activeSlots}
          setSelectedBySlot={onCurrentSlide ? setCurrentSlots : () => {}}
          swapMode={onCurrentSlide ? swapMode : false}
          swapTargetSlot={onCurrentSlide ? swapTargetSlot : null}
          onReplaceSlot={onCurrentSlide ? onReplaceSlot : undefined}
          highlightApplied={onCurrentSlide ? previewHighlight : false}
          anchoredItemIds={anchoredItemIds}
          onToggleAnchor={onCurrentSlide ? onToggleAnchor : undefined}
          onRemoveItem={onCurrentSlide ? onRemoveItem : undefined}
          onAnchorAllPreview={onCurrentSlide ? onAnchorAllPreview : undefined}
          readOnly={!onCurrentSlide}
          compact
          className="h-full w-full border-0 bg-transparent p-0 shadow-none"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-white/85 via-white/40 to-transparent px-3 pb-8 pt-3">
        <div className="pointer-events-auto mx-auto max-w-xs text-center">
          <p className="text-sm font-semibold text-indigo-900">{headerLabel}</p>
          {activeAi ? (
            <p className="truncate text-xs text-indigo-700/75">
              {activeAi.label}
              {activeAi.name ? ` · ${activeAi.name}` : ""}
            </p>
          ) : (
            <p className="truncate text-xs text-indigo-700/75">
              Use arrows to browse AI looks
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        disabled={activeIndex <= 0}
        aria-label="Previous outfit"
        className="absolute left-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-indigo-200/80 bg-white/95 text-indigo-900 shadow-md backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        id="carousel-next-arrow"
        onClick={() => go(1)}
        disabled={activeIndex >= totalSlides - 1}
        aria-label={
          showNextHint
            ? "Next outfit — browse AI looks"
            : "Next outfit"
        }
        className={`absolute right-2 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border bg-white/95 text-indigo-900 shadow-md backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 ${
          showNextHint
            ? "carousel-next-hint border-indigo-500 bg-indigo-50"
            : "border-indigo-200/80"
        }`}
      >
        <ChevronRight
          className={`h-5 w-5 ${showNextHint ? "animate-pulse" : ""}`}
        />
      </button>

      <div
        className={`absolute left-1/2 z-10 flex -translate-x-1/2 items-center justify-center gap-2 ${dotsBottomClass}`}
        role="tablist"
        aria-label="Outfit slides"
      >
        {Array.from({ length: totalSlides }, (_, index) => (
          <button
            key={
              index === 0 ? "current" : aiSlides[index - 1]?.recommendation.id
            }
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={
              index === 0
                ? "Show your look"
                : `Show AI look ${index} of ${recommendations.length}`
            }
            onClick={() => onActiveIndexChange(index)}
            className={`h-2 rounded-full shadow-sm transition ${
              index === activeIndex
                ? "w-6 bg-indigo-600"
                : "w-2 bg-white/90 ring-1 ring-indigo-200 hover:bg-indigo-100"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function emptySlots(): Partial<Record<Slot, ClothingItem[] | null>> {
  return { head: null, body: null, legs: null, feet: null };
}
