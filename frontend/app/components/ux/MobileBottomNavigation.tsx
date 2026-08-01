"use client";

import { useState } from "react";
import { Home, Shirt, Layers, Wand2 } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { View } from "../../types/clothes";
import ProfileMenu from "./ProfileMenu";
import { goToNextTourStepOutfit } from "../OnBoardingTourOutfit";

type MobileBottomNavigationProps = {
  view: View;
  setView: (view: View) => void;
  onBuyCredits: () => void;
};

const tabs: {
  id: View;
  label: string;
  icon: typeof Home;
  tourId?: string;
}[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "wardrobe", label: "Wardrobe", icon: Shirt },
  { id: "outfits", label: "Outfits", icon: Layers },
  { id: "createOutfit", label: "Create", icon: Wand2, tourId: "create-outfit-btn" },
];

function isTabActive(view: View, tabId: View) {
  if (tabId === "wardrobe") {
    return view === "wardrobe" || view === "clothingDetails" || view === "addClothes";
  }
  if (tabId === "home") return view === "home";
  if (tabId === "outfits") return view === "outfits" || view === "outfitDetails";
  if (tabId === "createOutfit") return view === "createOutfit";
  return false;
}

export default function MobileBottomNavigation({
  view,
  setView,
  onBuyCredits,
}: MobileBottomNavigationProps) {
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-almaari-border/70 bg-almaari-surface/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.35rem, var(--safe-bottom))" }}
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch gap-0.5 px-1.5 pt-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(view, tab.id);
          return (
            <li key={tab.id} className="flex min-w-0 flex-1">
              <button
                type="button"
                id={tab.tourId}
                onClick={() => {
                  setProfileOpen(false);
                  setView(tab.id);
                  if (tab.id === "createOutfit") goToNextTourStepOutfit();
                }}
                className={`flex min-h-touch min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
                  active
                    ? "bg-almaari-accent text-white"
                    : "text-almaari-ink hover:bg-almaari-accent-soft"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="truncate">{tab.label}</span>
              </button>
            </li>
          );
        })}

        <li className="relative flex min-w-0 flex-[0.85]">
          <button
            type="button"
            aria-expanded={profileOpen}
            aria-label="Profile menu"
            onClick={() => setProfileOpen((o) => !o)}
            className={`flex min-h-touch min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold ${
              profileOpen
                ? "bg-almaari-accent text-white"
                : "text-almaari-ink hover:bg-almaari-accent-soft"
            }`}
          >
            {user?.picture ? (
              // Auth0 CDN avatars — plain img avoids remotePatterns config
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.picture}
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-almaari-accent-soft text-[10px] font-bold">
                {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate">You</span>
          </button>

          {profileOpen ? (
            <div className="absolute bottom-[calc(100%+0.35rem)] right-0 z-50 min-w-[12rem]">
              <ProfileMenu
                onBuyCredits={onBuyCredits}
                onClose={() => setProfileOpen(false)}
              />
            </div>
          ) : null}
        </li>
      </ul>
    </nav>
  );
}
