"use client";

import { motion } from "framer-motion";
import {
  revealTransition,
  revealUp,
  revealViewport,
  usePrefersReducedMotion,
} from "./useLandingMotion";

const STEPS = [
  {
    title: "Upload your clothes",
    body: "Add photos from your device in seconds.",
  },
  {
    title: "AI cleans and tags",
    body: "Background removal and smart labels—automatically.",
  },
  {
    title: "Create outfits fast",
    body: "Filter by color, season, and more to style quickly.",
  },
  {
    title: "Personal styling help",
    body: "Get outfit recommendations from Almaari’s AI stylist.",
  },
];

export default function HowItWorks() {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      id="how"
      className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
      aria-labelledby="how-heading"
    >
      <motion.div
        initial={reduced ? false : revealUp.initial}
        whileInView={revealUp.whileInView}
        viewport={revealViewport}
        transition={revealTransition}
        className="mx-auto max-w-2xl text-center"
      >
        <h2
          id="how-heading"
          className="font-display text-2xl text-almaari-ink sm:text-3xl"
        >
          How Almaari works
        </h2>
        <p className="mt-2 text-almaari-muted">
          Four simple steps to a smarter digital wardrobe.
        </p>
      </motion.div>

      <ol className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <motion.li
            key={step.title}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={{ ...revealTransition, delay: reduced ? 0 : index * 0.06 }}
            className="rounded-almaari-lg border border-almaari-border/80 bg-almaari-surface-raised p-5 shadow-soft"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-almaari-accent-soft text-sm font-semibold text-almaari-accent">
              {index + 1}
            </span>
            <h3 className="mt-3 font-display text-lg text-almaari-ink">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-almaari-muted">
              {step.body}
            </p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
