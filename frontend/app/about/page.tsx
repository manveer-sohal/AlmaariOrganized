import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "../components/MarketingShell";
import { createPageMetadata } from "../lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "Learn what Almaari is: an AI wardrobe organizer and personal stylist for cataloging clothes, creating outfits, and using what you already own.",
  path: "/about",
});

const PILLARS = [
  {
    title: "Digital wardrobe",
    body: "Turn photos of your clothes into a searchable closet you can actually use.",
  },
  {
    title: "Outfit creation",
    body: "Mix pieces you already own into looks—fast, without starting from scratch.",
  },
  {
    title: "Personal styling",
    body: "Get practical AI suggestions based on your wardrobe, not a stranger’s catalog.",
  },
];

export default function AboutPage() {
  return (
    <MarketingShell
      title="About Almaari"
      description="An AI wardrobe organizer and personal stylist built to help you wear what you already own."
    >
      <section className="rounded-2xl border border-indigo-100/80 bg-white/80 p-6 shadow-sm shadow-indigo-100/40 backdrop-blur sm:p-8">
        <p className="text-lg leading-relaxed text-indigo-900/85">
          Most people own more clothes than they actively wear. Almaari makes
          that wardrobe usable—organized, searchable, and ready for outfit
          creation every morning.
        </p>
        <p className="mt-4 text-indigo-800/75">
          Upload photos, let Almaari clean and tag them, then browse, filter,
          and build looks—or ask the AI stylist for ideas when you need a nudge.
        </p>
      </section>

      <section aria-labelledby="why-almaari">
        <h2
          id="why-almaari"
          className="text-sm font-semibold uppercase tracking-wider text-indigo-600"
        >
          Why Almaari
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-2xl border border-indigo-100/80 bg-white/70 p-5 shadow-sm transition-shadow hover:shadow-md hover:shadow-indigo-100/50"
            >
              <h3 className="font-semibold text-indigo-950">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-indigo-800/75">
                {pillar.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <p className="pt-2 text-indigo-800/70">
        Curious what it can do?{" "}
        <Link
          href="/features"
          className="font-medium text-indigo-700 underline-offset-2 hover:underline"
        >
          Explore features
        </Link>{" "}
        or{" "}
        <Link
          href="/"
          className="font-medium text-indigo-700 underline-offset-2 hover:underline"
        >
          head home
        </Link>
        .
      </p>
    </MarketingShell>
  );
}
