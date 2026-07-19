"use client";

import { useEffect, useMemo, useRef } from "react";
import { ClothingItem, Slot } from "../../types/clothes";
import { OutfitRecommendation } from "../../types/aiStylist";
import BuilderOutfitPreview from "./BuilderOutfitPreview";
import { ChevronLeft, ChevronRight } from "lucide-react";

const emptySlots = (): Partial<Record<Slot, ClothingItem[] | null>> => ({
  head: null,
  body: null,
  legs: null,
  feet: null,
});

/** Map a recommendation into preview slot bags for the canvas. */
export function recommendationToSlots(
  recommendation: OutfitRecommendation,
  clothesById: Map<string, ClothingItem>,
): Partial<Record<Slot, ClothingItem[] | null>> {
  const next = emptySlots();
  const layering = recommendation.layering;
  const placed = new Set<string>();

  const append = (item: ClothingItem) => {
    const slot = item.slot as Slot;
    const existing = next[slot] || [];
    if (existing.some((c) => c._id === item._id)) return;
    next[slot] = [...existing, item];
    placed.add(item._id);
  };

  if (layering) {
    for (const id of [
      layering.baseTopId,
      layering.midLayerId,
      layering.outerLayerId,
      layering.neckwearId,
    ]) {
      if (!id) continue;
      const item = clothesById.get(id);
      if (item) append(item);
    }
  }

  recommendation.itemIds.forEach((id) => {
    if (placed.has(id)) return;
    const item = clothesById.get(id);
    if (item) append(item);
  });

  return next;
}

type MobilePreviewCarouselProps = {
  /** User’s current working outfit — always the first (leftmost) slide. */
  currentSlots: Partial<Record<Slot, ClothingItem[] | null>>;
  setCurrentSlots: (
    updater: (
      prev: Partial<Record<Slot, ClothingItem[] | null>>,
    ) => Partial<Record<Slot, ClothingItem[] | null>>,
  ) => void;
  recommendations: OutfitRecommendation[];
  clothesById: Map<string, ClothingItem>;
  /** 0 = current outfit; 1+ = AI recommendation index - 1 */
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /** Increment to force a smooth scroll to the active slide (e.g. after Use Outfit). */
  scrollReturnNonce?: number;
  anchoredItemIds?: string[];
  onToggleAnchor?: (id: string) => void;
  onRemoveItem?: (id: string) => void;
  onAnchorAllPreview?: () => void;
  swapMode?: boolean;
  swapTargetSlot?: Slot | null;
  onReplaceSlot?: (slot: Slot) => void;
  previewHighlight?: boolean;
};

/**
 * Swipeable previews: [Your look] · [AI 1] · [AI 2] · [AI 3]
 * Swipe left to browse generated looks; Use Outfit returns to slide 0.
 */
export default function MobilePreviewCarousel({
  currentSlots,
  setCurrentSlots,
  recommendations,
  clothesById,
  activeIndex,
  onActiveIndexChange,
  scrollReturnNonce = 0,
  anchoredItemIds = [],
  onToggleAnchor,
  onRemoveItem,
  onAnchorAllPreview,
  swapMode = false,
  swapTargetSlot = null,
  onReplaceSlot,
  previewHighlight = false,
}: MobilePreviewCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const ignoreScrollSyncRef = useRef(false);
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

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[activeIndex] as HTMLElement | undefined;
    if (!child) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    ignoreScrollSyncRef.current = true;

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        child.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          inline: "start",
          block: "nearest",
        });
        el.scrollTo({
          left: child.offsetLeft,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    });

    const clearIgnore = window.setTimeout(
      () => {
        ignoreScrollSyncRef.current = false;
      },
      reduceMotion ? 50 : 500,
    );

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(clearIgnore);
    };
  }, [activeIndex, totalSlides, scrollReturnNonce]);

  const onScroll = () => {
    if (ignoreScrollSyncRef.current) return;
    const el = scrollerRef.current;
    if (!el || el.children.length === 0) return;
    const width = el.clientWidth;
    if (!width) return;
    const next = Math.round(el.scrollLeft / width);
    const clamped = Math.min(totalSlides - 1, Math.max(0, next));
    if (clamped !== activeIndex) onActiveIndexChange(clamped);
  };

  const go = (delta: number) => {
    onActiveIndexChange(
      Math.min(totalSlides - 1, Math.max(0, activeIndex + delta)),
    );
  };

  const headerLabel = onCurrentSlide
    ? "Your look"
    : `Look ${activeIndex} of ${recommendations.length}`;

  return (
    <section
      aria-label="Outfit previews"
      className="flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden"
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={activeIndex <= 0}
          aria-label="Previous outfit"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-almaari-border bg-almaari-surface-raised text-almaari-ink disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-semibold text-almaari-ink">
            {headerLabel}
          </p>
          {activeAi ? (
            <p className="truncate text-[11px] text-almaari-muted">
              {activeAi.label}
              {activeAi.name ? ` · ${activeAi.name}` : ""}
            </p>
          ) : (
            <p className="truncate text-[11px] text-almaari-muted">
              Swipe for AI looks
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={activeIndex >= totalSlides - 1}
          aria-label="Next outfit"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-almaari-border bg-almaari-surface-raised text-almaari-ink disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="mt-1.5 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Slide 0 — current working outfit */}
        <div className="box-border flex h-full min-h-0 w-full min-w-full max-w-full shrink-0 snap-center snap-always flex-col items-center justify-center px-2">
          <div className="relative mx-auto aspect-[3/4] w-[min(320px,86vw)] shrink-0 overflow-hidden">
            <div className="absolute inset-0">
              <BuilderOutfitPreview
                selectedBySlot={currentSlots}
                setSelectedBySlot={setCurrentSlots}
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
        </div>

        {/* Slides 1+ — AI-generated looks to the right */}
        {aiSlides.map(({ recommendation, slots }) => (
          <div
            key={recommendation.id}
            className="box-border flex h-full min-h-0 w-full min-w-full max-w-full shrink-0 snap-center snap-always flex-col items-center justify-center px-2"
          >
            <div className="relative mx-auto aspect-[3/4] w-[min(320px,86vw)] shrink-0 overflow-hidden">
              <div className="absolute inset-0">
                <BuilderOutfitPreview
                  selectedBySlot={slots}
                  setSelectedBySlot={() => {}}
                  readOnly
                  compact
                  anchoredItemIds={anchoredItemIds}
                  className="h-full w-full border-0 bg-transparent p-0 shadow-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-1.5 flex shrink-0 items-center justify-center gap-1.5"
        role="tablist"
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
            className={`h-1.5 rounded-full transition ${
              index === activeIndex
                ? "w-4 bg-almaari-accent"
                : "w-1.5 bg-almaari-chrome"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
