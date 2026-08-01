import Image from "next/image";
import Link from "next/link";
import Logo from "../../Logo.png";

export default function LandingFooter() {
  return (
    <footer className="border-t border-almaari-border/70 bg-almaari-bg px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
          >
            <Image src={Logo} alt="Almaari logo" width={28} height={28} />
            <span className="font-display text-lg text-almaari-ink">Almaari</span>
          </Link>
          <p className="mt-2 max-w-xs text-sm text-almaari-muted">
            AI wardrobe organizer and personal stylist.
          </p>
          <p className="mt-4 text-sm text-almaari-muted">
            Almaari © {new Date().getFullYear()}
          </p>
        </div>

        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-almaari-muted"
          aria-label="Footer"
        >
          <Link
            href="/features"
            className="min-h-11 inline-flex items-center transition-colors hover:text-almaari-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
          >
            Features
          </Link>
          <Link
            href="/about"
            className="min-h-11 inline-flex items-center transition-colors hover:text-almaari-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="min-h-11 inline-flex items-center transition-colors hover:text-almaari-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="min-h-11 inline-flex items-center transition-colors hover:text-almaari-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
