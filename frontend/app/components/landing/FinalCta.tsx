"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AlmaariMascot from "../../dashboard/CreateOutfit/almaariMascot";
import Login from "../login";
import Signup from "../signup";
import {
  revealTransition,
  revealUp,
  revealViewport,
  usePrefersReducedMotion,
} from "./useLandingMotion";

export default function FinalCta() {
  const reduced = usePrefersReducedMotion();
  const [celebrating, setCelebrating] = useState(false);

  return (
    <section
      className="px-4 py-14 sm:px-6 sm:py-20"
      aria-labelledby="final-cta-heading"
    >
      <motion.div
        initial={reduced ? false : revealUp.initial}
        whileInView={revealUp.whileInView}
        viewport={revealViewport}
        transition={revealTransition}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-almaari-lg border border-almaari-border/80 bg-gradient-to-br from-almaari-accent-soft via-almaari-surface-raised to-almaari-warm px-6 py-12 shadow-card sm:px-10 sm:py-14"
      >
        <div className="relative z-10 max-w-xl">
          <h2
            id="final-cta-heading"
            className="font-display text-3xl text-almaari-ink sm:text-4xl"
          >
            Open your closet. Dress with intention.
          </h2>
          <p className="mt-3 text-almaari-muted">
            Start free—upload a few pieces and let Almaari help you see what you
            already have.
          </p>
          <div
            className="mt-7 flex flex-wrap gap-3"
            onMouseEnter={() => setCelebrating(true)}
            onMouseLeave={() => setCelebrating(false)}
          >
            <Signup type="homepage" />
            <Login type="homepage" />
          </div>
        </div>

        <motion.div
          className="pointer-events-none absolute -bottom-6 right-2 w-28 sm:right-8 sm:w-36 md:w-40"
          animate={
            reduced
              ? undefined
              : celebrating
                ? { y: -6, scale: 1.04 }
                : { y: 0, scale: 1 }
          }
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          aria-hidden
        >
          <div className="[&_svg]:h-auto [&_svg]:w-full">
            <AlmaariMascot />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
