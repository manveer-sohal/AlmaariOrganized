"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "./Logo.png";
import { motion } from "framer-motion";
import AlmaariMascot from "./dashboard/CreateOutfit/almaariMascot";
import Login from "./components/login";
import Signup from "./components/signup";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50 text-indigo-900">
      <header className="w-full">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4"
          aria-label="Primary"
        >
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md font-bold text-white">
              <Image src={Logo} alt="Almaari logo" width={32} height={32} />
            </div>
            <span className="animate-wiggle font-semibold">Almaari</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm sm:flex">
            <Link href="#home" className="hover:text-indigo-600">
              Home
            </Link>
            <Link href="#about" className="hover:text-indigo-600">
              About
            </Link>
            <Link href="#features" className="hover:text-indigo-600">
              Features
            </Link>
            <Link href="/about" className="hover:text-indigo-600">
              Our story
            </Link>
            <Login type="navbar" />
            <Signup type="navbar" />
          </div>
        </nav>
      </header>

      <main>
        <section id="home" className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-indigo-950 sm:text-5xl sm:leading-[1.1]">
                Almaari:{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                  AI wardrobe organizer
                </span>{" "}
                & personal stylist
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-indigo-800/75">
                Catalog what you own, create outfits in seconds, and get styling
                help from your digital wardrobe, without buying more.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Signup type="homepage" />
                <Login type="homepage" />
              </div>
            </motion.div>
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-md shadow-indigo-100/60 backdrop-blur">
                <AlmaariMascot />
              </div>
            </motion.div>
          </div>
        </section>

        <motion.section
          id="about"
          className="mx-auto max-w-6xl px-4 py-12"
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            How Almaari works
          </h2>
          <p className="mt-2 text-center text-indigo-700/80">
            Three simple steps to a smarter digital wardrobe.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-indigo-100 bg-white/80 p-5 text-center shadow-sm backdrop-blur">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 16v3h16v-3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 4v12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M8 8l4-4 4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="font-semibold">Upload your clothes</div>
              <div className="mt-1 text-sm text-indigo-700/80">
                Add photos from your device in seconds.
              </div>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-white/80 p-5 text-center shadow-sm backdrop-blur">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 17v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 12h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 12h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="font-semibold">AI cleans and tags</div>
              <div className="mt-1 text-sm text-indigo-700/80">
                Background removal and smart labels—automatically.
              </div>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-white/80 p-5 text-center shadow-sm backdrop-blur">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M11 11l9 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="8.5"
                    cy="8.5"
                    r="5.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="font-semibold">Create outfits fast</div>
              <div className="mt-1 text-sm text-indigo-700/80">
                Filter by color, season, and more to style quickly.
              </div>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-white/80 p-5 text-center shadow-sm backdrop-blur">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 3v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 17v4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3 12h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M17 12h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <div className="font-semibold">Personal styling help</div>
              <div className="mt-1 text-sm text-indigo-700/80">
                Get outfit recommendations from Almaari’s AI stylist.
              </div>
            </div>
          </div>
        </motion.section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-2 text-center text-2xl font-bold sm:text-3xl">
            Features for your digital wardrobe
          </h2>
          <p className="mb-6 text-center text-indigo-700/80">
            Everything you need to organize clothes and generate outfits in one
            place.{" "}
            <Link
              href="/features"
              className="font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              See all features
            </Link>
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Auto Background Removal",
              "Smart Tagging",
              "Outfit Management",
              "Cloud Sync",
              "Privacy and Security",
              "Fast and Free to Start",
            ].map((feat) => (
              <div
                key={feat}
                className="rounded-xl border border-indigo-100 bg-white/80 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3.5 w-3.5"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0L3.293 9.207a1 1 0 1 1 1.414-1.414l3.046 3.046 6.543-6.546a1 1 0 0 1 1.411 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <div className="font-medium">{feat}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-indigo-700/80">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-indigo-100 pt-6 sm:flex-row">
          <div>Almaari © {new Date().getFullYear()}</div>
          <nav
            className="flex flex-wrap items-center justify-center gap-4"
            aria-label="Footer"
          >
            <Link href="/features" className="hover:text-indigo-900">
              Features
            </Link>
            <Link href="/about" className="hover:text-indigo-900">
              About
            </Link>
            <Link href="/privacy" className="hover:text-indigo-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-indigo-900">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
