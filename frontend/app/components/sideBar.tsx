import ChooseColour from "../dashboard/components/chooseColour";
import ValidateType from "../dashboard/components/validateType";
import TagFilterPicker from "../dashboard/components/TagFilterPicker";
import { materials_List, fits_List, patterns_List } from "../data/constants";
import React, { useEffect, useRef, useState } from "react";
import { useClothesStore } from "../store/useClothesStore";
import { goToNextTourStepOutfit } from "./OnBoardingTourOutfit";
import { useCredits } from "../hooks/useCredits";
import { View } from "../types/clothes";
import {
  Check,
  Shirt,
  Home,
  Filter,
  Eye,
  Coins,
  ListChecks,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CreditsBalanceButton from "./CreditsBalanceButton";
import CheckList from "../dashboard/components/CheckList";

type SideBarProp = {
  view: View;
  setView: (view: View) => void;
  onBuyCredits: () => void;
  collapsed?: boolean;
};

const TOGGLE_LOCK_MS = 320;

function SideBar({
  view,
  setView,
  onBuyCredits,
  collapsed = false,
}: SideBarProp) {
  const [active, setActive] = useState(false);
  const [displayFilterType, setDisplayFilterType] = useState("none");
  const [colour, setColour] = useState<string[] | null | undefined>([]);
  const [type, setType] = useState<string[] | null | undefined>([]);
  const [material, setMaterial] = useState<string[] | null | undefined>([]);
  const [fit, setFit] = useState<string[] | null | undefined>([]);
  const [pattern, setPattern] = useState<string[] | null | undefined>([]);
  const filters = useClothesStore((s) => s.filters);
  const setFilters = useClothesStore((s) => s.setFilters);
  const setMenuOpen = useClothesStore((s) => s.setMenuOpen);
  const { credits, isLoadingCredits } = useCredits();
  const toggleLockUntil = useRef(0);

  useEffect(() => {
    if (!collapsed) return;
    setDisplayFilterType("none");
    setActive(false);
  }, [collapsed]);

  const toggleSidebar = (nextOpen: boolean) => {
    const now = Date.now();
    if (now < toggleLockUntil.current) return;
    toggleLockUntil.current = now + TOGGLE_LOCK_MS;
    setMenuOpen(nextOpen);
  };

  const changeFilter = (
    nextColour: string[],
    nextType: string[],
    nextMaterial: string[],
    nextFit: string[],
    nextPattern: string[],
  ) => {
    setFilters({
      ...filters,
      colour: nextColour,
      type: nextType,
      material: nextMaterial,
      fit: nextFit,
      pattern: nextPattern,
    });
  };

  const onClickFilter = () => {
    if (collapsed) {
      toggleSidebar(true);
      setDisplayFilterType("block");
      setActive(true);
      return;
    }
    if (displayFilterType === "none") {
      setDisplayFilterType("block");
      setActive(true);
    } else {
      setDisplayFilterType("none");
      setActive(false);
    }
  };

  const handleSubmit = () => {
    changeFilter(
      colour ?? [],
      type ?? [],
      material ?? [],
      fit ?? [],
      pattern ?? [],
    );
    onClickFilter();
  };

  const navBtnClass = (isActive: boolean) =>
    `inline-flex h-10 shrink-0 items-center overflow-hidden whitespace-nowrap font-medium rounded-xl m-1 cursor-pointer border transition-colors duration-200 ${
      collapsed
        ? "w-10 justify-center p-0"
        : "w-[calc(100%-0.5rem)] justify-center gap-2 text-base px-3"
    } ${
      isActive
        ? "bg-indigo-500 text-white border-indigo-500"
        : "bg-indigo-100/70 text-indigo-900 border-indigo-200 hover:bg-indigo-500 hover:text-white hover:border-indigo-500"
    }`;

  return (
    <div className="h-full w-full">
      <ul
        className={`border-indigo-300 border-l-4 h-[93.4vh] text-center bg-indigo-400/100 flex flex-col shadow-md justify-between ${
          collapsed ? "items-center px-1.5 py-[2.1vh]" : "p-3 py-[2.1vh]"
        }`}
      >
        <div
          className={`flex flex-col ${
            collapsed ? "items-center w-full" : "items-center justify-center"
          }`}
        >
          <button
            type="button"
            onClick={() => setView("home")}
            title="Home"
            aria-label="Home"
            className={navBtnClass(view === "home")}
          >
            <Home className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed ? <span className="truncate">Home</span> : null}
          </button>

          <button
            type="button"
            className={navBtnClass(active)}
            onClick={onClickFilter}
            aria-pressed={active}
            title="Filter"
            aria-label="Filter"
          >
            <Filter className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed ? <span className="truncate">Filter</span> : null}
          </button>

          <div
            className={`dropdwn rounded-lg flex-col ${
              collapsed || displayFilterType !== "block" ? "hidden" : "flex"
            }`}
          >
            <div className="relative bg-white/80 backdrop-blur border border-indigo-200 shadow-md p-3 rounded-lg flex flex-col gap-2">
              <ChooseColour colour={setColour} />
              <ValidateType type={setType} />
              <TagFilterPicker
                label="Material:"
                placeholder="Enter material ie. cotton"
                inputId="filter-material"
                datalistId="filter-materials"
                options={materials_List}
                onTagsChange={setMaterial}
              />
              <TagFilterPicker
                label="Fit:"
                placeholder="Enter fit ie. slim"
                inputId="filter-fit"
                datalistId="filter-fits"
                options={fits_List}
                onTagsChange={setFit}
              />
              <TagFilterPicker
                label="Pattern:"
                placeholder="Enter pattern ie. striped"
                inputId="filter-pattern"
                datalistId="filter-patterns"
                options={patterns_List}
                onTagsChange={setPattern}
              />
            </div>

            <button
              type="button"
              className="w-1/2 inline-flex items-center justify-center gap-2 font-medium px-4 py-2 rounded-xl m-1 cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
              onClick={handleSubmit}
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Apply
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setView("outfits")}
            title="View Outfits"
            aria-label="View Outfits"
            className={navBtnClass(view === "outfits")}
          >
            <Eye className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed ? (
              <span className="whitespace-nowrap">View Outfits</span>
            ) : null}
          </button>

          <button
            type="button"
            id="desktop-sidebar-button"
            onClick={() => {
              setView("createOutfit");
              goToNextTourStepOutfit();
            }}
            title="Create Outfit"
            aria-label="Create Outfit"
            className={navBtnClass(view === "createOutfit")}
          >
            <Shirt className="h-5 w-5 shrink-0" aria-hidden />
            {!collapsed ? (
              <span className="whitespace-nowrap">Create Outfit</span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => toggleSidebar(true)}
            title="Getting started checklist"
            aria-label="Open getting started checklist"
            className={`${navBtnClass(false)} ${collapsed ? "" : "hidden"}`}
          >
            <ListChecks className="h-5 w-5 shrink-0" aria-hidden />
          </button>

          {/* Keep mounted while collapsed to avoid remounting queries/animations.
              Stable min-width + overflow clip prevents wrap during rail shrink. */}
          <div
            className={`overflow-hidden ${
              collapsed ? "hidden" : "w-full min-w-[196px]"
            }`}
          >
            <CheckList variant="sidebar" />
          </div>
        </div>

        <div
          className={`flex flex-col items-center justify-center ${
            collapsed ? "w-full gap-1" : ""
          }`}
        >
          <button
            type="button"
            onClick={onBuyCredits}
            title={
              credits != null
                ? `Credits: ${credits}. Buy more`
                : "Buy more credits"
            }
            aria-label={
              credits != null
                ? `Credits ${credits}. Buy more`
                : "Buy more credits"
            }
            disabled={isLoadingCredits && credits == null}
            className={`${navBtnClass(view === "buyCredits")} ${
              collapsed ? "" : "hidden"
            }`}
          >
            <Coins className="h-5 w-5 shrink-0" aria-hidden />
          </button>

          <div className={collapsed ? "hidden" : "w-full"}>
            <CreditsBalanceButton
              credits={credits}
              isLoading={isLoadingCredits}
              onBuyCredits={onBuyCredits}
              active={view === "buyCredits"}
            />
          </div>

          <button
            type="button"
            onClick={() => toggleSidebar(collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="desktop-sidebar"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`mt-2 inline-flex items-center justify-center rounded-xl border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors ${
              collapsed ? "h-10 w-10" : "h-9 w-full"
            }`}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" aria-hidden />
            ) : (
              <ChevronLeft className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </ul>
    </div>
  );
}

export default SideBar;
