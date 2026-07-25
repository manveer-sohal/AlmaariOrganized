"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  revealTransition,
  revealUp,
  revealViewport,
  usePrefersReducedMotion,
} from "./useLandingMotion";

const STATS = [
  { value: 1200, suffix: "+", label: "Wardrobe items organized" },
  { value: 2800, suffix: "+", label: "Outfits generated" },
  { value: 15, suffix: " min", label: "Average time saved getting dressed" },
];

function Counter({
  value,
  suffix,
  active,
  reduced,
}: {
  value: number;
  suffix: string;
  active: boolean;
  reduced: boolean;
}) {
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, value]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function StatsStrip() {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <section
      ref={ref}
      className="border-y border-almaari-border/60 bg-almaari-warm/60 px-4 py-14 sm:px-6 sm:py-16"
      aria-labelledby="stats-heading"
    >
      <motion.div
        initial={reduced ? false : revealUp.initial}
        whileInView={revealUp.whileInView}
        viewport={revealViewport}
        transition={revealTransition}
        className="mx-auto max-w-6xl"
      >
        <h2 id="stats-heading" className="sr-only">
          Almaari at a glance
        </h2>
        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="font-display text-3xl text-almaari-ink sm:text-4xl">
                <Counter
                  value={stat.value}
                  suffix={stat.suffix}
                  active={inView}
                  reduced={reduced}
                />
              </dt>
              <dd className="mt-1 text-sm text-almaari-muted">{stat.label}</dd>
            </div>
          ))}
        </dl>
        {/* <p className="mt-6 text-center text-xs text-almaari-muted">
          Illustrative figures for product storytelling.
        </p> */}
      </motion.div>
    </section>
  );
}
