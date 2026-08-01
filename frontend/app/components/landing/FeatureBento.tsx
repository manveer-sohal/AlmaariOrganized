"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shirt, Sparkles, Layers, Search, Luggage, Sun } from "lucide-react";
import {
  revealTransition,
  revealUp,
  revealViewport,
  usePrefersReducedMotion,
} from "./useLandingMotion";

const CARDS = [
  {
    title: "AI stylist",
    body: "Generate complete looks from what you already own.",
    icon: Sparkles,
    span: "sm:col-span-2",
  },
  {
    title: "Wardrobe organization",
    body: "Smart tags keep every piece easy to find.",
    icon: Shirt,
    span: "",
  },
  {
    title: "Outfit builder",
    body: "Compose and save looks on a visual stage.",
    icon: Layers,
    span: "",
  },
  {
    title: "Smart search",
    body: "Filter by color, season, and type in a tap.",
    icon: Search,
    span: "",
  },
  {
    title: "Travel packing",
    body: "Plan capsule looks for trips without overpacking.",
    icon: Luggage,
    span: "",
  },
  {
    title: "Seasonal suggestions",
    body: "Rotate pieces that fit the weather and occasion.",
    icon: Sun,
    span: "sm:col-span-3",
  },
];

export default function FeatureBento() {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      id="features"
      className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
      aria-labelledby="features-heading"
    >
      <motion.div
        initial={reduced ? false : revealUp.initial}
        whileInView={revealUp.whileInView}
        viewport={revealViewport}
        transition={revealTransition}
        className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div className="max-w-xl">
          <h2
            id="features-heading"
            className="font-display text-2xl text-almaari-ink sm:text-3xl"
          >
            Features for your digital wardrobe
          </h2>
          <p className="mt-2 text-almaari-muted">
            Everything you need to organize clothes and generate outfits in one
            place.
          </p>
        </div>
        <Link
          href="/features"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-almaari-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
        >
          See all features
        </Link>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.title}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={revealViewport}
              transition={{
                ...revealTransition,
                delay: reduced ? 0 : index * 0.04,
              }}
              whileHover={reduced ? undefined : { y: -3 }}
              className={`rounded-almaari-lg border border-almaari-border/80 bg-almaari-surface-raised p-5 shadow-soft transition-shadow hover:shadow-card ${card.span}`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-almaari bg-almaari-accent-soft text-almaari-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-display text-lg text-almaari-ink">
                {card.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-almaari-muted">
                {card.body}
              </p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
