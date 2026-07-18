import type { Metadata } from "next";
import { createPrivatePageMetadata } from "../lib/seo";

export const metadata: Metadata = createPrivatePageMetadata(
  "/settings",
  "Settings",
);

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
