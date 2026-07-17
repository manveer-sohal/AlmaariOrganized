"use client";

import SideBar from "./sideBar";
import { useClothesStore } from "../store/useClothesStore";
import { View } from "../types/clothes";

type DesktopSidebarRailProps = {
  view: View;
  setView: (view: View) => void;
  onBuyCredits: () => void;
};

/** Expanded rail width — keep in sync with the open rail layout. */
const SIDEBAR_EXPANDED_WIDTH_CLASS = "w-[clamp(220px,20vw,280px)]";
const SIDEBAR_COLLAPSED_WIDTH_CLASS = "w-16";

/**
 * Owns sidebar open/collapsed width so the dashboard content area
 * does not re-render on every collapse toggle.
 *
 * Outer width animates with overflow clipping. Inner keeps a matching
 * fixed width so labels do not wrap/reflow while the rail shrinks.
 */
export default function DesktopSidebarRail({
  view,
  setView,
  onBuyCredits,
}: DesktopSidebarRailProps) {
  const menuOpen = useClothesStore((s) => s.menuOpen);

  return (
    <div
      id="desktop-sidebar"
      className={`z-10 hidden md:block overflow-hidden transition-[width] duration-300 ease-out ${
        menuOpen
          ? SIDEBAR_EXPANDED_WIDTH_CLASS
          : SIDEBAR_COLLAPSED_WIDTH_CLASS
      }`}
    >
      <div
        className={`sidebar-container h-full ${
          menuOpen
            ? SIDEBAR_EXPANDED_WIDTH_CLASS
            : SIDEBAR_COLLAPSED_WIDTH_CLASS
        }`}
      >
        <SideBar
          view={view}
          setView={setView}
          onBuyCredits={onBuyCredits}
          collapsed={!menuOpen}
        />
      </div>
    </div>
  );
}
