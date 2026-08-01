"use client";

import { motion } from "framer-motion";
import {
  revealTransition,
  revealUp,
  revealViewport,
  usePrefersReducedMotion,
} from "./useLandingMotion";

const QUOTES = [
  {
    id: "intentional-mornings",
    quote:
      "I finally wear what I already own. Almaari makes mornings feel intentional instead of scrambled.",
    role: "Early user",
  },
  {
    id: "stylist-friend",
    quote:
      "The stylist feels like a friend who knows my closet—not a feed trying to sell me more clothes.",
    role: "Beta tester",
  },
  {
    id: "clean-tagged-cards",
    quote:
      "Uploading a few pieces and getting clean, tagged cards was the moment it clicked for me.",
    role: "Wardrobe organizer",
  },
];

export default function Testimonials() {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
      aria-labelledby="testimonials-heading"
    >
      <motion.div
        initial={reduced ? false : revealUp.initial}
        whileInView={revealUp.whileInView}
        viewport={revealViewport}
        transition={revealTransition}
        className="max-w-xl"
      >
        <h2
          id="testimonials-heading"
          className="font-display text-2xl text-almaari-ink sm:text-3xl"
        >
          What early users notice
        </h2>
        <p className="mt-2 text-sm text-almaari-muted">
          Illustrative quotes reflecting the experience we’re designing for.
        </p>
      </motion.div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {QUOTES.map((item, index) => (
          <motion.blockquote
            key={item.id}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={revealViewport}
            transition={{
              ...revealTransition,
              delay: reduced ? 0 : index * 0.05,
            }}
            whileHover={reduced ? undefined : { y: -2 }}
            className="flex h-full flex-col rounded-almaari-lg border border-almaari-border/80 bg-almaari-surface-raised p-6 shadow-soft"
          >
            <p className="flex-1 font-display text-lg leading-snug text-almaari-ink">
              “{item.quote}”
            </p>
            <footer className="mt-5 text-sm text-almaari-muted">
              {item.role}
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
