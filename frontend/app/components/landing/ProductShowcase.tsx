"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import SampleClothingImage from "./SampleClothingImage";
import {
  SHOWCASE_OUTFIT,
  SHOWCASE_OUTFIT_SRCS,
  SHOWCASE_WARDROBE,
} from "./sampleImages";
import { usePrefersReducedMotion } from "./useLandingMotion";

type Phase = "wardrobe" | "styling" | "outfit";

export default function ProductShowcase() {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>("wardrobe");
  const [visibleTiles, setVisibleTiles] = useState(reduced ? 8 : 0);
  const [outfitSlots, setOutfitSlots] = useState(reduced ? 4 : 0);

  useEffect(() => {
    if (reduced) {
      setVisibleTiles(8);
      setOutfitSlots(4);
      setPhase("outfit");
      return;
    }

    let cancelled = false;
    let timers: number[] = [];

    const clearTimers = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
    };

    const runCycle = () => {
      if (cancelled) return;
      clearTimers();
      setPhase("wardrobe");
      setVisibleTiles(0);
      setOutfitSlots(0);

      SHOWCASE_WARDROBE.forEach((_, i) => {
        timers.push(
          window.setTimeout(() => {
            if (!cancelled) setVisibleTiles(i + 1);
          }, 120 + i * 90),
        );
      });

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setPhase("styling");
        }, 1100),
      );

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) setPhase("outfit");
          for (let i = 0; i < 4; i++) {
            timers.push(
              window.setTimeout(() => {
                if (!cancelled) setOutfitSlots(i + 1);
              }, i * 220),
            );
          }
        }, 1700),
      );

      timers.push(
        window.setTimeout(() => {
          if (!cancelled) runCycle();
        }, 4800),
      );
    };

    runCycle();
    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [reduced]);

  return (
    <div
      className="relative w-full max-w-full overflow-hidden rounded-almaari-lg border border-almaari-border/80 bg-almaari-surface-raised shadow-card"
      aria-hidden="true"
    >
      <div className="flex items-center gap-2 border-b border-almaari-border/70 bg-almaari-warm/80 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-almaari-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-almaari-accent-soft" />
        <span className="h-2.5 w-2.5 rounded-full bg-almaari-accent/40" />
        <div className="ml-2 flex-1 rounded-md bg-white/70 px-2.5 py-1 text-[10px] text-almaari-muted">
          almaari.app/dashboard
        </div>
      </div>

      <div className="relative min-h-[280px] bg-gradient-to-b from-almaari-warm to-almaari-bg p-3 sm:min-h-[340px] sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-sm text-almaari-ink">Your wardrobe</p>
          <AnimatePresence mode="wait">
            {phase !== "wardrobe" ? (
              <motion.span
                key="ai"
                initial={reduced ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1 rounded-full bg-almaari-accent-soft px-2 py-0.5 text-[10px] font-semibold text-almaari-accent"
              >
                <Sparkles className="h-3 w-3" />
                {phase === "styling" ? "Styling…" : "Look ready"}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {SHOWCASE_WARDROBE.map((item, i) => {
            const isOutfitPiece = SHOWCASE_OUTFIT_SRCS.has(item.src);
            const outfitSlotIndex = SHOWCASE_OUTFIT.findIndex(
              (piece) => piece.src === item.src,
            );
            const ringActive =
              phase === "outfit" &&
              outfitSlotIndex >= 0 &&
              outfitSlots > outfitSlotIndex;

            return (
              <motion.div
                key={`${item.src}-${i}`}
                className="relative aspect-square rounded-lg border border-almaari-border/40"
                initial={false}
                animate={{
                  opacity: i < visibleTiles ? 1 : 0.15,
                  scale: i < visibleTiles ? 1 : 0.92,
                }}
                transition={{ duration: 0.25 }}
              >
                <SampleClothingImage
                  item={item}
                  className="h-full w-full rounded-lg"
                  sizes="(max-width: 640px) 20vw, 96px"
                  priority={isOutfitPiece}
                />
                {isOutfitPiece ? (
                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-almaari-accent ring-offset-1 ring-offset-almaari-bg"
                    initial={false}
                    animate={{
                      opacity: ringActive ? 1 : 0,
                      scale: ringActive ? 1 : 1.06,
                    }}
                    transition={{
                      duration: reduced ? 0.15 : 0.55,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                ) : null}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 flex items-end justify-center gap-2 sm:gap-3">
          {SHOWCASE_OUTFIT.map((item, slot) => (
            <motion.div
              key={item.src}
              className={`overflow-hidden rounded-xl border border-almaari-border/60 bg-white/80 shadow-soft ${
                slot === 0
                  ? "h-10 w-10 sm:h-12 sm:w-12"
                  : slot === 1
                    ? "h-14 w-12 sm:h-16 sm:w-14"
                    : slot === 2
                      ? "h-16 w-11 sm:h-[4.5rem] sm:w-12"
                      : "h-8 w-10 sm:h-9 sm:w-11"
              }`}
              initial={false}
              animate={{
                opacity: slot < outfitSlots ? 1 : 0.25,
                y: slot < outfitSlots ? 0 : 8,
                scale: slot < outfitSlots ? 1 : 0.96,
              }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {slot < outfitSlots ? (
                <SampleClothingImage
                  item={item}
                  className="h-full w-full rounded-xl"
                  sizes="64px"
                />
              ) : null}
            </motion.div>
          ))}
        </div>

        {!reduced && phase === "styling" ? (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(79,93,154,0.12),transparent_55%)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
        ) : null}
      </div>
    </div>
  );
}
