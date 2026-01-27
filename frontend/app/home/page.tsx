"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "../Logo.png";
import { motion } from "framer-motion";
import AlmaariMascot from "../dashboard/CreateOutfit/almaariMascot";
import Login from "../components/login";
import Signup from "../components/signup";
export default function Homepage() {
  return (
    <div className=" min-h-screen bg-gradient-to-b from-indigo-50 via-white to-indigo-50 text-indigo-900">
      {/* Nav */}
      <header className="w-full">
        <nav className="mx-auto max-w-6xl flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Image src={Logo} alt="Almaari Logo" width={32} height={32} />
            </div>
            <span className="animate-wiggle font-semibold">
              Almaari Organizer
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <Link href="#home" className="hover:text-indigo-600">
              Home
            </Link>
            <Link href="#about" className="hover:text-indigo-600">
              About
            </Link>
            <Login type="navbar" />
            <Signup type="navbar" />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="home" className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-indigo-900">
              Your Smart Wardrobe, Organized by AI.
            </h1>
            <p className="mt-4 text-lg text-indigo-700/80">
              Upload your clothes, remove backgrounds, and auto-tag outfits
              instantly.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <Signup type="homepage" />
              <Login type="homepage" />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="bg-white/70 backdrop-blur border border-indigo-100 rounded-2xl shadow-md p-4">
              <AlmaariMascot />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}

      <motion.section
        id="about"
        className="mx-auto max-w-6xl px-4 py-12"
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center">
          How It Works
        </h2>
        <p className="text-center text-indigo-700/80 mt-2">
          Three simple steps to a smarter wardrobe.
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* 1 */}
          <div className="bg-white/80 backdrop-blur border border-indigo-100 rounded-xl p-5 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
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
            <div className="text-sm text-indigo-700/80 mt-1">
              Add photos from your device in seconds.
            </div>
          </div>
          {/* 2 */}
          <div className="bg-white/80 backdrop-blur border border-indigo-100 rounded-xl p-5 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
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
            <div className="text-sm text-indigo-700/80 mt-1">
              Background removal and smart labels-automatically.
            </div>
          </div>
          {/* 3 */}
          <div className="bg-white/80 backdrop-blur border border-indigo-100 rounded-xl p-5 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
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
            <div className="font-semibold">Find outfits in seconds</div>
            <div className="text-sm text-indigo-700/80 mt-1">
              Filter by color, season, and more to style fast.
            </div>
          </div>
          {/* 4 */}
          <div className="bg-white/80 backdrop-blur border border-indigo-100 rounded-xl p-5 text-center shadow-sm">
            <div className="mx-auto h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
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
            <div className="font-semibold">Have an AI Assistant</div>
            <div className="text-sm text-indigo-700/80 mt-1">
              Get personalized outfit recommendations and styling tips.
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
          Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="bg-white/80 backdrop-blur border border-indigo-100 rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
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

      {/* Footer */}
      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-indigo-700/80">
        <div className="border-t border-indigo-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>Almaari Organizer © 2025</div>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-indigo-900">
              Privacy
            </Link>
            <Link href="#" className="hover:text-indigo-900">
              Terms
            </Link>
            <Link href="#" className="hover:text-indigo-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
