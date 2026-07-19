"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "./motion";

type InlineSuccessStateProps = {
  show: boolean;
  message?: string;
  className?: string;
};

export default function InlineSuccessState({
  show,
  message = "Saved",
  className = "",
}: InlineSuccessStateProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          className={`inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 ${className}`}
          role="status"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-3.5 w-3.5" aria-hidden />
          </span>
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
