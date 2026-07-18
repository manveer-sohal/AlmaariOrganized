import type { Metadata } from "next";
import { createPrivatePageMetadata } from "../lib/seo";

export const metadata: Metadata = createPrivatePageMetadata(
  "/travelMode",
  "Travel mode",
);

export default function TravelModeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
