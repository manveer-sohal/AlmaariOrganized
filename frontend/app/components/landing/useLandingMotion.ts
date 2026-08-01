"use client";

import { softTransition, usePrefersReducedMotion } from "../ux/motion";

export { softTransition, usePrefersReducedMotion };

export const revealViewport = { once: true, amount: 0.25 as const };

export const revealUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
};

export const revealTransition = {
  duration: 0.45,
  ease: [0.22, 1, 0.36, 1] as const,
};
