"use client";

import { useCallback } from "react";
import { useOverlayFocus } from "./useOverlayFocus";

type MobileGenerationHistorySheetProps = {
  open: boolean;
  onClose: () => void;
  generationLabel: string | null;
  canGoPrev: boolean;
  canGoNext: boolean;
  onHistoryPrev: () => void;
  onHistoryNext: () => void;
  prompt?: string | null;
};

export default function MobileGenerationHistorySheet({
  open,
  onClose,
  generationLabel,
  canGoPrev,
  canGoNext,
  onHistoryPrev,
  onHistoryNext,
  prompt,
}: MobileGenerationHistorySheetProps) {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const containerRef = useOverlayFocus(open, handleClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close history"
        onClick={handleClose}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-sheet-title"
        className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-indigo-200 bg-white p-4 shadow-2xl md:inset-x-auto md:bottom-auto md:right-6 md:top-24 md:w-full md:max-w-sm md:rounded-2xl"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-indigo-200 md:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="history-sheet-title"
              className="text-lg font-semibold text-indigo-900"
            >
              History
            </h2>
            <p className="mt-1 text-sm text-indigo-700/80">
              {generationLabel || "No generations yet"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-11 rounded-xl border border-indigo-200 px-3 text-sm font-medium text-indigo-800"
          >
            Close
          </button>
        </div>

        {prompt ? (
          <p className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs text-indigo-800">
            Refinement: {prompt}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onHistoryPrev}
            disabled={!canGoPrev}
            className="min-h-11 flex-1 rounded-xl border border-indigo-200 px-3 text-sm font-semibold text-indigo-900 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onHistoryNext}
            disabled={!canGoNext}
            className="min-h-11 flex-1 rounded-xl border border-indigo-200 px-3 text-sm font-semibold text-indigo-900 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
