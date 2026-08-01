"use client";

import Image from "next/image";
import { Heart, Sparkles, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { ClothingItem, Outfit } from "../../types/clothes";
import { useFavouritesStore } from "../../store/useFavouritesStore";
import { softTransition, usePrefersReducedMotion } from "./motion";

type OutfitCardProps = {
  outfit: Outfit;
  reason?: string;
  selected?: boolean;
  onOpen?: (outfit: Outfit) => void;
  onImprove?: (outfit: Outfit) => void;
  onWear?: (outfit: Outfit) => void;
  className?: string;
};

function OutfitThumb({ items }: { items: ClothingItem[] }) {
  const shown = items.slice(0, 4);
  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 bg-almaari-warm">
      {shown.map((item) => (
        <div key={item._id} className="relative overflow-hidden">
          <Image
            src={item.imageSrc || ""}
            alt=""
            fill
            className="object-cover"
            sizes="120px"
          />
        </div>
      ))}
      {shown.length < 4
        ? Array.from({ length: 4 - shown.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-almaari-accent-soft/50" />
          ))
        : null}
    </div>
  );
}

export default function OutfitCard({
  outfit,
  reason,
  selected,
  onOpen,
  onImprove,
  onWear,
  className = "",
}: OutfitCardProps) {
  const reduced = usePrefersReducedMotion();
  const isFavourite = useFavouritesStore((s) =>
    s.outfitIds.includes(outfit.uniqueId),
  );
  const toggleOutfit = useFavouritesStore((s) => s.toggleOutfit);

  return (
    <motion.article
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={softTransition}
      className={`overflow-hidden rounded-almaari-lg bg-almaari-surface-raised shadow-card ${
        selected ? "ring-2 ring-almaari-accent" : ""
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => onOpen?.(outfit)}
        className="relative block aspect-[4/5] w-full overflow-hidden"
        aria-label={`Open ${outfit.name}`}
      >
        <OutfitThumb items={outfit.outfit_items} />
      </button>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base text-almaari-ink">
              {outfit.name}
            </h3>
            {reason ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-almaari-muted">
                {reason}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label={isFavourite ? "Unfavourite outfit" : "Favourite outfit"}
            aria-pressed={isFavourite}
            onClick={() => toggleOutfit(outfit.uniqueId)}
            className="touch-target shrink-0 inline-flex items-center justify-center rounded-full text-almaari-ink"
          >
            <Heart
              className={`h-4 w-4 ${
                isFavourite ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {onWear ? (
            <button
              type="button"
              onClick={() => onWear(outfit)}
              className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-almaari-accent px-3 text-xs font-semibold text-white"
            >
              Wear this
            </button>
          ) : null}
          {onImprove ? (
            <button
              type="button"
              onClick={() => onImprove(outfit)}
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-almaari-accent-soft px-3 text-xs font-semibold text-almaari-ink"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Improve
            </button>
          ) : null}
          {onOpen ? (
            <button
              type="button"
              onClick={() => onOpen(outfit)}
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border border-almaari-border px-3 text-xs font-semibold text-almaari-ink"
              aria-label="Replace an item"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Open
            </button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
