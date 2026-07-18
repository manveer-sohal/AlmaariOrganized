import type { Metadata } from "next";
import { createPrivatePageMetadata } from "../lib/seo";

export const metadata: Metadata = createPrivatePageMetadata("/admin", "Admin");

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
