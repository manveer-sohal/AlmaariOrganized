"use client";

import { motion } from "framer-motion";
import AlmaariMascot from "../../dashboard/CreateOutfit/almaariMascot";
import Login from "../login";
import Signup from "../signup";
import ProductShowcase from "./ProductShowcase";
import { usePrefersReducedMotion } from "./useLandingMotion";

export default function LandingHero() {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      id="home"
      className="relative overflow-x-hidden px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,_rgba(232,235,245,0.9),_transparent_60%)]"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="min-w-0"
        >
          <p className="font-display text-3xl tracking-tight text-almaari-ink sm:text-4xl">
            Almaari
          </p>
          <h1 className="mt-2 max-w-xl font-display text-3xl leading-[1.15] text-almaari-ink sm:text-4xl lg:text-[2.75rem]">
            AI wardrobe organizer & personal stylist
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-almaari-muted sm:text-lg">
            Catalog what you own, create outfits in seconds, and get styling
            help from your digital wardrobe—without buying more.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Signup type="homepage" />
            <Login type="homepage" />
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-almaari-muted">
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-almaari-accent" aria-hidden />
              Your closet
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-almaari-accent" aria-hidden />
              Your style
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-almaari-accent" aria-hidden />
              AI assist
            </li>
          </ul>
        </motion.div>

        <motion.div
          className="relative min-w-0"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: reduced ? 0 : 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <ProductShowcase />
          <div className="pointer-events-none absolute -bottom-4 -right-2 w-[7.5rem] scale-75 sm:-bottom-6 sm:-right-4 sm:w-[9rem] sm:scale-90">
            <div className="origin-bottom-right [&_svg]:h-auto [&_svg]:w-full">
              <AlmaariMascot />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
