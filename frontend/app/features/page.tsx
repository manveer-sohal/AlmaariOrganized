import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "../components/MarketingShell";
import { createPageMetadata } from "../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Features",
  description:
    "Explore Almaari features: digital wardrobe cataloging, smart tagging, outfit creation, and an AI personal stylist.",
  path: "/features",
});

const FEATURES = [
  {
    title: "Digital wardrobe catalog",
    body: "Upload clothing photos and keep a searchable wardrobe of what you own.",
    accent: "from-indigo-500/15 to-indigo-500/5",
  },
  {
    title: "Smart tagging",
    body: "AI cleans images and labels items so filtering by type, color, and more stays easy.",
    accent: "from-violet-500/15 to-violet-500/5",
  },
  {
    title: "Outfit creation",
    body: "Build and save outfits from pieces already in your closet.",
    accent: "from-sky-500/15 to-sky-500/5",
  },
  {
    title: "AI personal stylist",
    body: "Get recommendations based on your clothes, occasion, and preferences.",
    accent: "from-fuchsia-500/10 to-indigo-500/5",
  },
  {
    title: "Cloud sync",
    body: "Access your wardrobe across sessions with a secure account.",
    accent: "from-indigo-500/10 to-white",
  },
  {
    title: "Free to start",
    body: "No complicated setup—upload, organize, and style in minutes.",
    accent: "from-emerald-500/10 to-indigo-50/40",
  },
];

export default function FeaturesPage() {
  return (
    <MarketingShell
      wide
      title="Features built for your wardrobe"
      description="A digital wardrobe organizer with outfit tools and an AI personal stylist—so you make better use of clothes you already own."
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li key={feature.title}>
            <article
              className={`group h-full rounded-2xl border border-indigo-100/80 bg-gradient-to-br ${feature.accent} p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/50`}
            >
              <div className="mb-3 h-1 w-8 rounded-full bg-indigo-500/70 transition-all group-hover:w-12" />
              <h2 className="text-lg font-semibold text-indigo-950">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-indigo-800/75">
                {feature.body}
              </p>
            </article>
          </li>
        ))}
      </ul>

      <section className="mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl border border-indigo-100 bg-white/80 p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-indigo-950">
            Ready to try Almaari?
          </h2>
          <p className="mt-1 text-sm text-indigo-800/70">
            Start free on the homepage—organize, create outfits, and style smarter.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Go to homepage
        </Link>
      </section>
    </MarketingShell>
  );
}
