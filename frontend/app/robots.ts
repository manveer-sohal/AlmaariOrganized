import type { MetadataRoute } from "next";
import { SITE_URL } from "./lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/settings",
          "/settings/",
          "/admin",
          "/admin/",
          "/feedback",
          "/feedback/",
          "/travelMode",
          "/travelMode/",
          "/home",
          "/home/",
          "/login",
          "/signup",
          "/callback",
          "/auth",
          "/auth/",
          "/onboarding",
          "/onboarding/",
          "/account",
          "/account/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
