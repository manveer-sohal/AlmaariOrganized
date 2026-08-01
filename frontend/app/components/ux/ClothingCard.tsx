"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Heart, MoreHorizontal, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { ClothingItem } from "../../types/clothes";
import { humanizeClothingSubtype } from "../../utils/clothingSubtype";
import { useFavouritesStore } from "../../store/useFavouritesStore";
import { useDeleteClothing } from "../../hooks/useDeleteClothing";
import { softTransition, usePrefersReducedMotion } from "./motion";

type ClothingCardProps = {
  item: ClothingItem;
  onSelect?: (item: ClothingItem) => void;
  onStyle?: (item: ClothingItem) => void;
};

export default function ClothingCard({
  item,
  onSelect,
  onStyle,
}: ClothingCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = usePrefersReducedMotion();
  const isFavourite = useFavouritesStore((s) =>
    s.clothingIds.includes(item._id),
  );
  const toggleClothing = useFavouritesStore((s) => s.toggleClothing);
  const deleteClothes = useDeleteClothing(item._id);
  const label = humanizeClothingSubtype(item);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <motion.article
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.92 }}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={softTransition}
      className="group relative aspect-[4/5] w-full overflow-hidden rounded-almaari bg-almaari-surface-raised shadow-card"
    >
      <button
        type="button"
        className="absolute inset-0 z-0"
        onClick={() => onSelect?.(item)}
        onPointerDown={() => {
          clearLongPress();
          longPressTimer.current = setTimeout(() => setMenuOpen(true), 480);
        }}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerCancel={clearLongPress}
        aria-label={`View ${label}`}
      />

      <Image
        src={item.imageSrc || ""}
        alt={label}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
        className={`object-cover transition-[filter,opacity] duration-300 ${
          loaded ? "opacity-100 blur-0" : "opacity-70 blur-sm"
        }`}
        onLoad={() => setLoaded(true)}
        loading="lazy"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-almaari-ink/55 to-transparent px-2.5 pb-2.5 pt-10">
        <p className="truncate text-left text-sm font-semibold text-white">
          {label}
        </p>
      </div>

      <button
        type="button"
        aria-label={isFavourite ? "Remove favourite" : "Add favourite"}
        aria-pressed={isFavourite}
        onClick={(e) => {
          e.stopPropagation();
          toggleClothing(item._id);
        }}
        className="absolute right-2 top-2 z-10 touch-target inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-almaari-ink shadow-sm backdrop-blur-sm transition-transform active:scale-90"
      >
        <Heart
          className={`h-4 w-4 transition-transform ${
            isFavourite ? "fill-rose-500 text-rose-500 scale-110" : ""
          }`}
        />
      </button>

      <div className="absolute left-2 top-2 z-10">
        <button
          type="button"
          aria-label="More actions"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className="touch-target inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-almaari-ink shadow-sm md:opacity-0 md:group-hover:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen ? (
          <div
            className="absolute left-0 top-full z-20 mt-1 min-w-[8.5rem] overflow-hidden rounded-xl bg-almaari-surface-raised py-1 shadow-soft"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2.5 text-left text-sm hover:bg-almaari-accent-soft"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onSelect?.(item);
              }}
            >
              View details
            </button>
            {onStyle ? (
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2.5 text-left text-sm hover:bg-almaari-accent-soft"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onStyle(item);
                }}
              >
                Style this
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                deleteClothes.mutate();
              }}
            >
              <Trash className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {item.isSample ? (
        <span className="absolute bottom-10 left-2 z-[1] rounded-md bg-almaari-accent/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          Sample
        </span>
      ) : null}
    </motion.article>
  );
}
