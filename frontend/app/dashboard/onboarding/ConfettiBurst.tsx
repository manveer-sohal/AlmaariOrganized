"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "../../components/ux/motion";

type Piece = {
  id: number;
  left: string;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  size: number;
};

const COLORS = ["#4f5d9a", "#e87a6b", "#f2d27a", "#7cb083", "#c9b8d4", "#273157"];

type ConfettiBurstProps = {
  /** Increment to fire a new burst. 0 = idle. */
  burstId: number;
  durationMs?: number;
};

export default function ConfettiBurst({
  burstId,
  durationMs = 2800,
}: ConfettiBurstProps) {
  const reduced = usePrefersReducedMotion();
  const [show, setShow] = useState(false);
  const pieces = useMemo<Piece[]>(() => {
    return Array.from({ length: 48 }, (_, id) => ({
      id,
      left: `${4 + ((id * 17) % 92)}%`,
      delay: (id % 12) * 0.04,
      duration: 1.6 + (id % 5) * 0.2,
      color: COLORS[id % COLORS.length],
      rotate: (id % 2 === 0 ? 1 : -1) * (20 + (id % 8) * 18),
      size: 6 + (id % 5) * 2,
    }));
  }, []);

  useEffect(() => {
    if (!burstId || reduced) {
      setShow(false);
      return;
    }
    setShow(true);
    const timer = window.setTimeout(() => setShow(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [burstId, durationMs, reduced]);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-hidden
        >
          {pieces.map((piece) => (
            <motion.span
              key={`${burstId}-${piece.id}`}
              className="absolute top-[-12px] rounded-sm"
              style={{
                left: piece.left,
                width: piece.size,
                height: piece.size * 1.4,
                backgroundColor: piece.color,
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: "110vh",
                opacity: [1, 1, 0],
                rotate: piece.rotate,
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: "easeIn",
              }}
            />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
