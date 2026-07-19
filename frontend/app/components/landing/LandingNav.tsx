"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "../../Logo.png";
import Login from "../login";
import Signup from "../signup";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const linkClass =
    "text-sm font-medium text-almaari-muted transition-colors hover:text-almaari-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent";

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled
          ? "border-b border-almaari-border/70 bg-almaari-surface/85 shadow-soft backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6"
        aria-label="Primary"
      >
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
        >
          <Image src={Logo} alt="Almaari logo" width={32} height={32} priority />
          <span className="font-display text-lg text-almaari-ink">Almaari</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <Link href="#features" className={linkClass}>
            Features
          </Link>
          <Link href="#how" className={linkClass}>
            How it works
          </Link>
          <Link href="/about" className={linkClass}>
            Story
          </Link>
          <Login type="navbar" />
          <Signup type="navbar" />
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-almaari text-almaari-ink md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-almaari-accent"
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {menuOpen ? (
        <div
          id="landing-mobile-menu"
          className="border-t border-almaari-border/60 bg-almaari-surface/95 px-4 py-4 backdrop-blur-md md:hidden"
        >
          <div className="flex flex-col gap-1">
            <Link
              href="#features"
              className="min-h-11 rounded-almaari px-3 py-2 text-sm font-medium text-almaari-ink"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#how"
              className="min-h-11 rounded-almaari px-3 py-2 text-sm font-medium text-almaari-ink"
              onClick={() => setMenuOpen(false)}
            >
              How it works
            </Link>
            <Link
              href="/about"
              className="min-h-11 rounded-almaari px-3 py-2 text-sm font-medium text-almaari-ink"
              onClick={() => setMenuOpen(false)}
            >
              Story
            </Link>
            <div className="mt-3 flex flex-col gap-2 border-t border-almaari-border/60 pt-3">
              <Login type="homepage" />
              <Signup type="homepage" />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
