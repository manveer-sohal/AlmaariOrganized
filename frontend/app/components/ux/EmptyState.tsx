"use client";

import { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  actionLabel,
  onAction,
  illustration,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
      role="status"
    >
      {illustration ? <div className="mb-4">{illustration}</div> : null}
      <p className="font-display text-xl text-almaari-ink sm:text-2xl">{title}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex min-h-touch touch-target items-center justify-center rounded-almaari bg-almaari-accent px-6 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98] hover:bg-almaari-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
