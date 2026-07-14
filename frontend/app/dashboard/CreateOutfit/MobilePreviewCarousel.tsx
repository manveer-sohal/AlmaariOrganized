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
  recommendations: OutfitRecommendation[];
  clothesById: Map<string, ClothingItem>;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  anchoredItemIds?: string[];
};

/**
 * Swipeable outfit preview: fills remaining height; canvas stays centered.
 * Use Outfit / feedback live in the fixed bottom bar.
 */
export default function MobilePreviewCarousel({
  recommendations,
  clothesById,
  activeIndex,
  onActiveIndexChange,
  anchoredItemIds = [],
}: MobilePreviewCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(
    () =>
      recommendations.map((rec) => ({
        recommendation: rec,
        slots: recommendationToSlots(rec, clothesById),
      })),
    [recommendations, clothesById],
  );

  const active = slides[activeIndex]?.recommendation ?? recommendations[0];

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[activeIndex] as HTMLElement | undefined;
    if (!child) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollTo({
      left: child.offsetLeft,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [activeIndex, recommendations.length]);

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.children.length === 0) return;
    const width = el.clientWidth;
    if (!width) return;
    const next = Math.round(el.scrollLeft / width);
    const clamped = Math.min(
      recommendations.length - 1,
      Math.max(0, next),
    );
    if (clamped !== activeIndex) onActiveIndexChange(clamped);
  };

  const go = (delta: number) => {
    onActiveIndexChange(
      Math.min(
        recommendations.length - 1,
        Math.max(0, activeIndex + delta),
      ),
    );
  };

  const noopSetSlots = () => {
    /* read-only AI slides */
  };

  return (
    <section
      aria-label="AI outfit previews"
      className="flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden"
    >
      <div className="flex shrink-0 items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={activeIndex <= 0}
          aria-label="Previous outfit"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-800 disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-sm font-semibold text-indigo-900">
            Outfit {activeIndex + 1} of {recommendations.length}
          </p>
          {active ? (
            <p className="truncate text-[11px] text-indigo-600">
              {active.label}
              {active.name ? ` · ${active.name}` : ""}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={activeIndex >= recommendations.length - 1}
          aria-label="Next outfit"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-200 bg-white text-indigo-800 disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="mt-1.5 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map(({ recommendation, slots }) => (
          <div
            key={recommendation.id}
            className="box-border flex h-full min-h-0 w-full min-w-full max-w-full shrink-0 snap-center snap-always flex-col items-center justify-center"
          >
            <BuilderOutfitPreview
              selectedBySlot={slots}
              setSelectedBySlot={noopSetSlots}
              readOnly
              compact
              anchoredItemIds={anchoredItemIds}
              className="flex h-full max-h-full w-full items-center justify-center border-0 bg-transparent p-0 shadow-none"
            />
            {recommendation.explanation ? (
              <p className="mt-1 line-clamp-1 max-w-[90%] shrink-0 text-center text-[11px] leading-snug text-indigo-800/90">
                {recommendation.explanation}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div
        className="mt-1.5 flex shrink-0 items-center justify-center gap-1.5"
        role="tablist"
      >
        {recommendations.map((rec, index) => (
          <button
            key={rec.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Show outfit ${index + 1} of ${recommendations.length}`}
            onClick={() => onActiveIndexChange(index)}
            className={`h-1.5 rounded-full transition ${
              index === activeIndex
                ? "w-4 bg-indigo-600"
                : "w-1.5 bg-indigo-200"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
