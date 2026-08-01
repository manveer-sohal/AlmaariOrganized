"use client";

import { ReactNode } from "react";

type ContextualStylistActionProps = {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  primary?: boolean;
  className?: string;
};

export default function ContextualStylistAction({
  label,
  onClick,
  icon,
  primary = false,
  className = "",
}: ContextualStylistActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 min-w-0 max-w-full items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent ${
        primary
          ? "bg-almaari-accent text-white shadow-soft"
          : "bg-almaari-accent-soft text-almaari-ink"
      } ${className}`}
    >
      {icon}
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}
