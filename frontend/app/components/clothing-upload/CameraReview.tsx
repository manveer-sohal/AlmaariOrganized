"use client";

import CameraShell from "./CameraShell";

type CameraReviewProps = {
  previewUrl: string;
  confirming?: boolean;
  onRetake: () => void;
  onConfirm: () => void;
  onClose: () => void;
};

export default function CameraReview({
  previewUrl,
  confirming = false,
  onRetake,
  onConfirm,
  onClose,
}: CameraReviewProps) {
  return (
    <CameraShell ariaLabel="Review captured photo" onBackdropClose={onClose}>
      <header className="flex shrink-0 items-center justify-between px-4 pb-3 pt-[max(0.75rem,var(--safe-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close review"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <span aria-hidden className="text-xl leading-none">
            ×
          </span>
        </button>
        <p className="font-display text-base text-white">Review photo</p>
        <div className="min-h-11 min-w-11" aria-hidden />
      </header>

      <div className="relative mx-4 min-h-0 flex-1 overflow-hidden rounded-almaari-lg bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt="Captured clothing preview"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="flex shrink-0 gap-3 px-4 py-4 pb-[max(1rem,var(--safe-bottom))]">
        <button
          type="button"
          onClick={onRetake}
          disabled={confirming}
          className="min-h-touch flex-1 rounded-almaari border border-white/25 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-50"
        >
          Retake
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming}
          className="min-h-touch flex-1 rounded-almaari bg-almaari-accent text-sm font-semibold text-white transition hover:bg-almaari-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-50"
        >
          {confirming ? "Processing…" : "Use photo"}
        </button>
      </div>
    </CameraShell>
  );
}
