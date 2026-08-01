"use client";

import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

type MobilePageHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: ReactNode;
  sticky?: boolean;
  className?: string;
};

export default function MobilePageHeader({
  title,
  subtitle,
  onBack,
  trailing,
  sticky = true,
  className = "",
}: MobilePageHeaderProps) {
  return (
    <header
      className={`${
        sticky ? "sticky top-0 z-20" : ""
      } flex items-center gap-3 border-b border-almaari-border/60 bg-almaari-bg/95 px-4 py-3 backdrop-blur-md safe-pt ${className}`}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="touch-target inline-flex items-center justify-center rounded-full text-almaari-ink hover:bg-almaari-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl text-almaari-ink">{title}</h1>
        {subtitle ? (
          <p className="truncate text-sm text-almaari-muted">{subtitle}</p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </header>
  );
}
