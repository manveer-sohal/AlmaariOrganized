import type { Metadata } from "next";

export const SITE_URL = "https://almaari.app";
export const SITE_NAME = "Almaari";
export const SITE_TAGLINE =
  "AI Wardrobe Organizer and Personal Stylist";

export const DEFAULT_TITLE =
  "Almaari | AI Wardrobe Organizer and Personal Stylist";

export const DEFAULT_DESCRIPTION =
  "Organize your wardrobe, create better outfits, and discover your personal style with Almaari, an AI-powered wardrobe organizer and personal stylist.";

export const SITE_KEYWORDS = [
  "Almaari",
  "Almaari app",
  "AI wardrobe organizer",
  "digital wardrobe organizer",
  "outfit generator",
  "AI personal stylist",
  "wardrobe organizer",
  "personal stylist",
];

/** Absolute URL helper for canonicals and sitemap entries. */
export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return SITE_URL;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export const DEFAULT_OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Almaari — AI wardrobe organizer and personal stylist",
};

/** Shared robots config for authenticated / low-value surfaces. */
export const NO_INDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
};

/**
 * Metadata for private app routes. Overrides the root homepage canonical
 * so dashboards do not claim https://almaari.app as their canonical URL.
 */
export function createPrivatePageMetadata(path: string, title: string): Metadata {
  return {
    title,
    robots: NO_INDEX_ROBOTS,
    alternates: { canonical: absoluteUrl(path) },
  };
}

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
    robots: noIndex
      ? NO_INDEX_ROBOTS
      : { index: true, follow: true },
  };
}
