"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { usePrefersReducedMotion } from "./useLandingMotion";

const TILES = [
  { id: "t1", tone: "bg-[#d8cfc4]" },
  { id: "t2", tone: "bg-[#c5cbe0]" },
  { id: "t3", tone: "bg-[#e8ebf5]" },
  { id: "t4", tone: "bg-[#b8a99a]" },
  { id: "t5", tone: "bg-[#9aa3bd]" },
  { id: "t6", tone: "bg-[#ebe4da]" },
  { id: "t7", tone: "bg-[#a8b0c8]" },
  { id: "t8", tone: "bg-[#d4ccc2]" },
];

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

      TILES.forEach((_, i) => {
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
              }, i * 180),
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
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-almaari-border/70 bg-almaari-warm/80 px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#d4ccc2]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#c5cbe0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#a8b0c8]" />
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
          {TILES.map((tile, i) => (
            <motion.div
              key={tile.id}
              className={`aspect-square rounded-lg ${tile.tone} ${
                phase === "outfit" && i < 4
                  ? "ring-2 ring-almaari-accent ring-offset-1 ring-offset-almaari-bg"
                  : ""
              }`}
              initial={false}
              animate={{
                opacity: i < visibleTiles ? 1 : 0.15,
                scale: i < visibleTiles ? 1 : 0.92,
              }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>

        <div className="mt-4 flex items-end justify-center gap-2 sm:gap-3">
          {[0, 1, 2, 3].map((slot) => (
            <motion.div
              key={slot}
              className={`rounded-xl border border-almaari-border/60 bg-white/80 shadow-soft ${
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
              }}
              transition={{ duration: 0.28 }}
              style={{
                background:
                  slot < outfitSlots
                    ? undefined
                    : "linear-gradient(180deg, #fbf9f5, #f4f1ec)",
              }}
            >
              {slot < outfitSlots ? (
                <div
                  className={`h-full w-full rounded-xl ${TILES[slot].tone}`}
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
