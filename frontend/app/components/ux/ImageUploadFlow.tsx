"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "./motion";

export type UploadStage =
  | "pick"
  | "preview"
  | "identifying"
  | "details"
  | "ready"
  | "saved";

const STAGE_COPY: Record<UploadStage, string> = {
  pick: "Add a photo",
  preview: "Looking good",
  identifying: "Identifying your item",
  details: "Adding details",
  ready: "Ready for your wardrobe",
  saved: "Saved to your wardrobe",
};

type ImageUploadFlowProps = {
  stage: UploadStage;
  children: ReactNode;
  statusOverride?: string;
};

export default function ImageUploadFlow({
  stage,
  children,
  statusOverride,
}: ImageUploadFlowProps) {
  const reduced = usePrefersReducedMotion();
  const status = statusOverride ?? STAGE_COPY[stage];
  const showStatus = stage !== "pick";

  return (
    <div className="flex h-full min-h-0 flex-col bg-almaari-bg">
      {showStatus ? (
        <div className="border-b border-almaari-border/50 px-4 py-3">
          <AnimatePresence mode="wait">
            <motion.p
              key={status}
              initial={reduced ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -4 }}
              className="text-center text-sm font-medium text-almaari-muted"
              role="status"
              aria-live="polite"
            >
              {status}
            </motion.p>
          </AnimatePresence>
          {(stage === "identifying" || stage === "details") && (
            <div className="mx-auto mt-2 h-1 max-w-[12rem] overflow-hidden rounded-full bg-almaari-accent-soft">
              <motion.div
                className="h-full rounded-full bg-almaari-accent"
                initial={{ width: "15%" }}
                animate={{ width: stage === "details" ? "70%" : "45%" }}
                transition={{ duration: reduced ? 0 : 0.6 }}
              />
            </div>
          )}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

export { STAGE_COPY };
