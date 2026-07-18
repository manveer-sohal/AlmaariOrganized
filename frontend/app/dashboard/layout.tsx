import type { Metadata } from "next";
import { createPrivatePageMetadata } from "../lib/seo";

/** Private app surfaces — keep out of search indexes. */
export const metadata: Metadata = createPrivatePageMetadata(
  "/dashboard",
  "Dashboard",
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
