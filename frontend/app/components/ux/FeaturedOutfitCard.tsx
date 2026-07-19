"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ClothingItem, Outfit, Slot } from "../../types/clothes";
import BuilderOutfitPreview from "../../dashboard/CreateOutfit/BuilderOutfitPreview";
import { softTransition, usePrefersReducedMotion } from "./motion";

type FeaturedOutfitCardProps = {
  outfit?: Outfit | null;
  reason?: string;
  onWear?: () => void;
  onGenerate?: () => void;
  emptyTitle?: string;
};

function outfitToSlots(
  outfit: Outfit,
): Partial<Record<Slot, ClothingItem[] | null>> {
  const slots: Partial<Record<Slot, ClothingItem[] | null>> = {
    head: null,
    body: null,
    legs: null,
    feet: null,
  };
  for (const item of outfit.outfit_items) {
    const slot = item.slot as Slot;
    const existing = slots[slot] || [];
    slots[slot] = [...existing, item];
  }
  return slots;
}

export default function FeaturedOutfitCard({
  outfit,
  reason = "Ready for today",
  onWear,
  onGenerate,
  emptyTitle = "Ask Almaari what to wear",
}: FeaturedOutfitCardProps) {
  const reduced = usePrefersReducedMotion();
  const selectedBySlot = useMemo(
    () => (outfit ? outfitToSlots(outfit) : null),
    [outfit],
  );

  if (!outfit || !selectedBySlot) {
    return (
      <motion.section
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={softTransition}
        className="box-border w-full max-w-full min-w-0 rounded-almaari-lg bg-almaari-warm px-3 py-5 text-center shadow-card"
      >
        <p className="font-display text-base text-almaari-ink sm:text-lg">
          {emptyTitle}
        </p>
        <button
          type="button"
          onClick={onGenerate}
          className="mt-3 inline-flex min-h-11 max-w-full items-center justify-center rounded-almaari bg-almaari-accent px-4 text-sm font-semibold text-white"
        >
          What should I wear?
        </button>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={softTransition}
      className="box-border w-full max-w-full min-w-0 overflow-hidden rounded-almaari-lg bg-gradient-to-b from-almaari-surface-raised to-almaari-bg shadow-[0_-3px_6px_-6px_rgba(0,0,0,0.3)] "
      aria-label="Featured outfit"
    >
      <div className="min-w-0 overflow-hidden px-2 pt-2 pl-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-almaari-muted">
          Today’s look
        </p>
        <h2 className="truncate font-display text-lg text-almaari-ink">
          {outfit.name}
        </h2>
        <p className="mt-0.5 truncate text-xs text-almaari-muted">{reason}</p>
      </div>

      <div className="box-border flex w-full min-w-0 justify-center overflow-hidden py-0">
        <div
          className="relative mx-auto w-full max-w-[20rem] overflow-hidden bg-transparent sm:max-w-[22rem]"
          style={{ aspectRatio: "3 / 4" }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <BuilderOutfitPreview
              selectedBySlot={selectedBySlot}
              setSelectedBySlot={() => {}}
              readOnly
              fill
              className="h-full w-full max-w-full overflow-hidden !border-0 !bg-transparent !shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="min-w-0 px-2 pb-2 pt-1">
        {/* <button
          type="button"
          onClick={onWear}
          className="box-border inline-flex min-h-11 w-full max-w-full items-center justify-center rounded-almaari bg-almaari-accent text-sm font-semibold text-white"
        >
          Wear this
        </button> */}
      </div>
    </motion.section>
  );
}
