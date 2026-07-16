"use client";

import { Home, Shirt, Eye, Plus, Settings } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { View } from "../types/clothes";
import { goToNextTourStep } from "./OnBoardingTour";
import { goToNextTourStepOutfit } from "./OnBoardingTourOutfit";
import Dropdown from "../dashboard/components/Dropdown";

type MobileNavBarProps = {
  view: View;
  setView: (view: View) => void;
  onAddClothes: () => void;
  onBuyCredits: () => void;
};

const tabClass = (active: boolean) =>
  `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
    active
      ? "bg-indigo-500 text-white"
      : "text-indigo-900 hover:bg-indigo-100/80"
  }`;

function MobileNavBar({
  view,
  setView,
  onAddClothes,
  onBuyCredits,
}: MobileNavBarProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-indigo-300 bg-indigo-400/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      <ul
        id="mobile-sidebar-ul"
        className="mx-auto flex max-w-lg items-stretch gap-0.5 px-1.5 pt-1.5"
      >
        <li className="flex min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              setShowSettings(false);
              setView("home");
            }}
            className={tabClass(view === "home")}
          >
            <Home className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">Home</span>
          </button>
        </li>

        <li className="flex min-w-0 flex-1">
          <button
            type="button"
            onClick={() => {
              setShowSettings(false);
              setView("outfits");
            }}
            className={tabClass(view === "outfits")}
          >
            <Eye className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">Outfits</span>
          </button>
        </li>

        <li className="flex min-w-0 flex-1">
          <button
            type="button"
            id="add-clothes-btn-mobile"
            title="Add Clothes"
            onClick={() => {
              setShowSettings(false);
              onAddClothes();
              goToNextTourStep();
            }}
            className={tabClass(view === "addClothes")}
          >
            <Plus className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">Add</span>
          </button>
        </li>
        <li className="flex min-w-0 flex-1">
          <button
            type="button"
            id="create-outfit-btn"
            onClick={() => {
              setShowSettings(false);
              setView("createOutfit");
              goToNextTourStepOutfit();
            }}
            className={tabClass(view === "createOutfit")}
          >
            <Shirt className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">Create</span>
          </button>
        </li>

        <li className="relative flex min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={showSettings}
            aria-label="Settings"
            onClick={() => setShowSettings((open) => !open)}
            className={tabClass(showSettings)}
          >
            <Settings className="h-5 w-5 shrink-0" aria-hidden />
            <span className="truncate">Settings</span>
          </button>

          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute bottom-[calc(100%+0.35rem)] right-0 z-50 min-w-[12rem]"
            >
              <Dropdown
                onBuyCredits={onBuyCredits}
                onClose={() => setShowSettings(false)}
              />
            </motion.div>
          )}
        </li>
      </ul>
    </nav>
  );
}

export default MobileNavBar;
