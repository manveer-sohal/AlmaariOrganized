import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "../Logo.png";

export default function MarketingShell({
  children,
  title,
  eyebrow,
  description,
  wide = false,
}: {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  description?: string;
  wide?: boolean;
}) {
  const width = wide ? "max-w-5xl" : "max-w-3xl";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-almaari-bg text-almaari-ink">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(232,235,245,0.85),_transparent_60%)]"
        aria-hidden
      />

      <header className="relative w-full border-b border-almaari-border/70 bg-almaari-surface/80 backdrop-blur-md">
        <nav
          className={`mx-auto flex ${width} items-center justify-between px-4 py-4`}
          aria-label="Primary"
        >
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-almaari-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
          >
            <Image src={Logo} alt="Almaari logo" width={28} height={28} />
            Almaari
          </Link>
          <div className="flex items-center gap-5 text-sm text-almaari-muted">
            <Link
              href="/features"
              className="transition-colors hover:text-almaari-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
            >
              Features
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:text-almaari-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
            >
              About
            </Link>
            <Link
              href="/"
              className="rounded-almaari bg-almaari-accent px-3 py-1.5 font-semibold text-white transition-colors hover:bg-almaari-accent-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
            >
              Home
            </Link>
          </div>
        </nav>
      </header>

      <main className={`relative mx-auto ${width} px-4 py-12 sm:py-16`}>
        {(eyebrow || title || description) && (
          <header className="mb-8">
            {eyebrow ? (
              <span className="inline-flex items-center rounded-full border border-almaari-border bg-almaari-surface-raised px-3 py-1 text-xs font-medium tracking-wide text-almaari-muted shadow-soft">
                {eyebrow}
              </span>
            ) : null}
            {title ? (
              <h1
                className={`${eyebrow ? "mt-4" : ""} font-display text-3xl tracking-tight text-almaari-ink sm:text-4xl`}
              >
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-3 text-lg leading-relaxed text-almaari-muted">
                {description}
              </p>
            ) : null}
          </header>
        )}
        <div className="space-y-8 text-left text-base leading-relaxed text-almaari-ink/90">
          {children}
        </div>
      </main>

      <footer
        className={`relative mx-auto ${width} px-4 py-10 text-sm text-almaari-muted`}
      >
        <div className="flex flex-col gap-3 border-t border-almaari-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span>Almaari © {new Date().getFullYear()}</span>
          <nav className="flex flex-wrap gap-4" aria-label="Footer">
            <Link
              href="/features"
              className="transition-colors hover:text-almaari-ink"
            >
              Features
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:text-almaari-ink"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-almaari-ink"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-almaari-ink"
            >
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
