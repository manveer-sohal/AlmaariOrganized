"use client";

import { motion } from "framer-motion";
import SampleClothingImage from "./SampleClothingImage";
import { STYLIST_OUTFIT_ROWS, WARDROBE_PREVIEW } from "./sampleImages";
import {
  revealTransition,
  revealUp,
  revealViewport,
  usePrefersReducedMotion,
} from "./useLandingMotion";

const STYLIST_LABELS = [
  "Everyday · Mild",
  "Dinner · Smart casual",
  "Work · Minimal",
];

export default function FeatureAlternating() {
  const reduced = usePrefersReducedMotion();

  return (
    <div className="space-y-16 px-4 py-6 sm:px-6 sm:py-10">
      <section
        className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14"
        aria-labelledby="stylist-feature-heading"
      >
        <motion.div
          initial={reduced ? false : revealUp.initial}
          whileInView={revealUp.whileInView}
          viewport={revealViewport}
          transition={revealTransition}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-almaari-accent">
            AI stylist
          </p>
          <h2
            id="stylist-feature-heading"
            className="mt-2 font-display text-2xl text-almaari-ink sm:text-3xl"
          >
            Ask for a look. Get three you can wear.
          </h2>
          <p className="mt-3 max-w-md text-almaari-muted">
            Almaari builds complete outfits from your wardrobe—then lets you
            refine, swap pieces, and save the one that feels right.
          </p>
          <ul className="mt-5 space-y-2 flex flex-col gap-2 text-sm text-almaari-ink">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-almaari-accent" />
              Occasion and weather aware
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-almaari-accent" />
              Anchor pieces you want to keep
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-almaari-accent" />
              Clear reasons for each suggestion
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={revealViewport}
          transition={revealTransition}
          className="overflow-hidden rounded-almaari-lg border border-almaari-border/80 bg-almaari-warm p-4 shadow-card"
          aria-hidden
        >
          <div className="space-y-2">
            {STYLIST_LABELS.map((label, i) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-almaari bg-almaari-surface-raised px-3 py-2.5 ${
                  i === 0 ? "ring-1 ring-almaari-accent/40" : ""
                }`}
              >
                <div className="flex -space-x-1.5">
                  {STYLIST_OUTFIT_ROWS[i].map((item) => (
                    <SampleClothingImage
                      key={item.src}
                      item={item}
                      className="h-8 w-8 rounded-md border border-almaari-border/50"
                      sizes="32px"
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-almaari-ink">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section
        className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14"
        aria-labelledby="wardrobe-feature-heading"
      >
        <motion.div
          initial={reduced ? false : { opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={revealViewport}
          transition={revealTransition}
          className="order-2 overflow-hidden rounded-almaari-lg border border-almaari-border/80 bg-almaari-surface-raised p-4 shadow-card lg:order-1"
          aria-hidden
        >
          <div className="grid grid-cols-3 gap-2">
            {WARDROBE_PREVIEW.map((item) => (
              <SampleClothingImage
                key={item.src}
                item={item}
                className="aspect-square rounded-lg border border-almaari-border/40 transition hover:scale-[1.03]"
                sizes="(max-width: 1024px) 28vw, 160px"
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={reduced ? false : revealUp.initial}
          whileInView={revealUp.whileInView}
          viewport={revealViewport}
          transition={revealTransition}
          className="order-1 lg:order-2"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-almaari-accent">
            Wardrobe
          </p>
          <h2
            id="wardrobe-feature-heading"
            className="mt-2 font-display text-2xl text-almaari-ink sm:text-3xl"
          >
            See your closet as a living catalog
          </h2>
          <p className="mt-3 max-w-md text-almaari-muted">
            Upload once. Almaari cleans backgrounds, tags pieces, and keeps
            everything searchable—so getting dressed feels lighter.
          </p>
          <ul className="mt-5 flex flex-row gap-4 text-sm text-almaari-ink">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-almaari-accent" />
              Auto background removal
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-almaari-accent" />
              Color and type tags
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-almaari-accent" />
              Cloud sync across devices
            </li>
          </ul>
        </motion.div>
      </section>
    </div>
  );
}
