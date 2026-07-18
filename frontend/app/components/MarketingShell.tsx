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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-indigo-50 text-indigo-900">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12),_transparent_60%)]"
        aria-hidden
      />

      <header className="relative w-full border-b border-indigo-100/70 bg-white/50 backdrop-blur-md">
        <nav
          className={`mx-auto flex ${width} items-center justify-between px-4 py-4`}
          aria-label="Primary"
        >
          <Link href="/" className="flex items-center gap-2 font-semibold text-indigo-950">
            <Image src={Logo} alt="Almaari logo" width={28} height={28} />
            Almaari
          </Link>
          <div className="flex items-center gap-5 text-sm text-indigo-800/80">
            <Link href="/features" className="transition-colors hover:text-indigo-600">
              Features
            </Link>
            <Link href="/about" className="transition-colors hover:text-indigo-600">
              About
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-indigo-700"
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
              <span className="inline-flex items-center rounded-full border border-indigo-200/80 bg-white/80 px-3 py-1 text-xs font-medium tracking-wide text-indigo-700 shadow-sm">
                {eyebrow}
              </span>
            ) : null}
            {title ? (
              <h1
                className={`${eyebrow ? "mt-4" : ""} text-3xl font-bold tracking-tight text-indigo-950 sm:text-4xl`}
              >
                {title}
              </h1>
            ) : null}
            {description ? (
              <p className="mt-3 text-lg leading-relaxed text-indigo-800/70">
                {description}
              </p>
            ) : null}
          </header>
        )}
        <div className="space-y-8 text-left text-base leading-relaxed text-indigo-900/85">
          {children}
        </div>
      </main>

      <footer className={`relative mx-auto ${width} px-4 py-10 text-sm text-indigo-700/80`}>
        <div className="flex flex-col gap-3 border-t border-indigo-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <span>Almaari © {new Date().getFullYear()}</span>
          <nav className="flex flex-wrap gap-4" aria-label="Footer">
            <Link href="/features" className="transition-colors hover:text-indigo-900">
              Features
            </Link>
            <Link href="/about" className="transition-colors hover:text-indigo-900">
              About
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-indigo-900">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-indigo-900">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
