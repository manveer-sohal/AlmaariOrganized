"use client";

import { Home, Shirt, Layers, Wand2 } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useState } from "react";
import { View } from "../../types/clothes";
import ProfileMenu from "./ProfileMenu";
import { goToNextTourStepOutfit } from "../OnBoardingTourOutfit";

type DesktopNavigationProps = {
  view: View;
  setView: (view: View) => void;
  onBuyCredits: () => void;
  onAddClothes: () => void;
};

const tabs: { id: View; label: string; icon: typeof Home; tourId?: string }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "wardrobe", label: "Wardrobe", icon: Shirt },
  { id: "outfits", label: "Outfits", icon: Layers },
  {
    id: "createOutfit",
    label: "Create",
    icon: Wand2,
    tourId: "create-outfit-btn-desktop",
  },
];

function isActive(view: View, tabId: View) {
  if (tabId === "wardrobe") {
    return (
      view === "wardrobe" ||
      view === "clothingDetails" ||
      view === "addClothes"
    );
  }
  if (tabId === "outfits") {
    return view === "outfits" || view === "outfitDetails";
  }
  return view === tabId;
}

export default function DesktopNavigation({
  view,
  setView,
  onBuyCredits,
  onAddClothes,
}: DesktopNavigationProps) {
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <aside className="hidden h-full w-[4.75rem] shrink-0 flex-col border-r border-almaari-border/60 bg-almaari-surface py-4 lg:w-52 md:flex">
      <div className="mb-6 px-3 lg:px-4">
        <p className="font-display text-lg text-almaari-ink lg:text-xl">
          <span className="lg:hidden">A</span>
          <span className="hidden lg:inline">Almaari</span>
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2" aria-label="Primary">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(view, tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              id={tab.tourId}
              onClick={() => {
                setView(tab.id);
                if (tab.id === "createOutfit") goToNextTourStepOutfit();
              }}
              className={`flex min-h-touch items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                active
                  ? "bg-almaari-accent text-white"
                  : "text-almaari-ink hover:bg-almaari-accent-soft"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="hidden truncate lg:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 px-2">
          <button
            type="button"
            id="add-clothes-btn-desktop"
            onClick={onAddClothes}
            className="flex min-h-touch w-full items-center justify-center gap-2 rounded-xl bg-almaari-accent-soft px-3 text-sm font-semibold text-almaari-ink hover:bg-almaari-chrome/50"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden lg:inline">Add item</span>
          </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex min-h-touch w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-almaari-ink hover:bg-almaari-accent-soft"
            aria-expanded={profileOpen}
            aria-label="Profile"
          >
            {user?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.picture}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-almaari-accent-soft text-xs font-bold">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="hidden truncate lg:inline">Profile</span>
          </button>
          {profileOpen ? (
            <div className="absolute bottom-full left-0 z-50 mb-2 w-56">
              <ProfileMenu
                onBuyCredits={onBuyCredits}
                onClose={() => setProfileOpen(false)}
              />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
