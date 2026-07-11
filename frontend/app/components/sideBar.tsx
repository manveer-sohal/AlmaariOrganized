import ChooseColour from "../dashboard/components/chooseColour";
import ValidateType from "../dashboard/components/validateType";
import TagFilterPicker from "../dashboard/components/TagFilterPicker";
import { materials_List, fits_List, patterns_List } from "../data/constants";
import React, { useState } from "react";
import WeatherCheck from "./weatherCheck";
import { useClothesStore } from "../store/useClothesStore";
import { goToNextTourStepOutfit } from "./OnBoardingTourOutfit";
import { useCredits } from "../hooks/useCredits";
import { View } from "../types/clothes";
import { Coins, Check, Shirt, Briefcase } from "lucide-react";
//  onQuery: (Dispatch<SetStateAction<{ colour: string[] | undefined; type: string[] | undefined; } | undefined>>) => void;
type SideBarProp = {
  view: View;
  setView: (view: View) => void;
  onBuyCredits: () => void;
};
function SideBar({ view, setView, onBuyCredits }: SideBarProp) {
  const [active, setActive] = useState<boolean>(false);
  const [displayFilterType, setDisplayFilterType] = useState<string>("none");
  const [colour, setColour] = useState<string[] | null | undefined>([]);
  const [type, setType] = useState<string[] | null | undefined>([]);
  const [material, setMaterial] = useState<string[] | null | undefined>([]);
  const [fit, setFit] = useState<string[] | null | undefined>([]);
  const [pattern, setPattern] = useState<string[] | null | undefined>([]);
  const { filters, setFilters } = useClothesStore();
  const { credits, isLoadingCredits } = useCredits();
  const changeFilter = (
    colour: string[],
    type: string[],
    material: string[],
    fit: string[],
    pattern: string[],
  ) => {
    setFilters({ ...filters, colour, type, material, fit, pattern });
    console.log(filters);
  };

  const onClickFilter = () => {
    if (displayFilterType == "none") {
      setDisplayFilterType("block");
      setActive(true);
    } else {
      setDisplayFilterType("none");
      setActive(false);
    }
    console.log(active);
  };

  const onClickOutfits = () => {
    setView("outfits");
  };

  const onClickCreateOutfits = () => {
    setView("createOutfit");
  };
  const onClickHome = () => {
    setView("home");
  };

  const onClickTravelMode = () => {
    setView("travelMode");
  };

  const handleSubmit = () => {
    console.log("apply");

    changeFilter(
      colour ?? [],
      type ?? [],
      material ?? [],
      fit ?? [],
      pattern ?? [],
    );

    onClickFilter();
  };
  return (
    <div className="bg-red-500 w-full">
      <ul className="border-indigo-300 border-l-4 p-3 w-full h-[93.4vh] text-center bg-indigo-400/100  py-[2.1vh] flex flex-col min-w-[150px] shadow-md justify-between">
        <div className="flex flex-col items-center justify-center ">
          <button
            onClick={() => onClickHome()}
            className={`w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl m-1 cursor-pointer border ${
              view === "home"
                ? "bg-indigo-500 text-white"
                : "bg-indigo-100/70 text-indigo-900"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 10L12 3l9 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 10v10h5v-6h4v6h5V10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Home</span>
          </button>
          <button
            className={`w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl m-1 cursor-pointer border ${
              active === true
                ? "bg-white text-indigo-900 border-indigo-300"
                : "bg-indigo-100/70 text-indigo-900 border-indigo-200"
            } hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors duration-200`}
            onClick={onClickFilter}
            aria-pressed={active}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 5h16l-6 7v5l-4 2v-7L4 5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Filter</span>
          </button>

          <div
            className={`dropdwn ${
              displayFilterType === "block" ? "flex" : "hidden"
            } rounded-lg flex-col`}
          >
            <div className="relative bg-white/80 backdrop-blur border border-indigo-200 shadow-md p-3 rounded-lg flex flex-col gap-2">
              <ChooseColour colour={setColour}></ChooseColour>
              <ValidateType type={setType}></ValidateType>
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
              className="w-1/2 inline-flex items-center justify-center gap-2 font-medium px-4 py-2 rounded-xl m-1 cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
              onClick={handleSubmit}
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Apply
              </span>
            </button>
          </div>
          <button className="w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl m-1 cursor-pointer border bg-indigo-100/70 text-indigo-900 border-indigo-200 hover:bg-indigo-500 active:bg-purple-600 hover:text-white hover:border-indigo-500 transition-colors duration-200">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 4h4v4H4zM16 4h4v4h-4zM10 10h4v4h-4zM4 16h4v4H4zM16 16h4v4h-4z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>Random</span>
          </button>
          <WeatherCheck></WeatherCheck>
          <button
            onClick={() => onClickOutfits()}
            className={`w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl m-1 cursor-pointer border bg-indigo-100/70 text-indigo-900 border-indigo-200 hover:bg-indigo-500 active:bg-purple-600 hover:text-white hover:border-indigo-500 transition-colors duration-200 ${
              view === "outfits"
                ? "bg-indigo-500 text-white"
                : "bg-indigo-100/70 text-indigo-900"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 12c2.5-4.5 7-7 10-7s7.5 2.5 10 7c-2.5 4.5-7 7-10 7S4.5 16.5 2 12z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>View Outfits</span>
          </button>
          <button
            id="desktop-sidebar-button"
            onClick={() => {
              onClickCreateOutfits();
              goToNextTourStepOutfit();
            }}
            className={`w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl m-1 cursor-pointer border hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors duration-200 ${
              view === "createOutfit"
                ? "bg-indigo-500 text-white"
                : "bg-indigo-100/70 text-indigo-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <Shirt className="w-4 h-4" /> Create Outfit
            </span>
          </button>

          <button
            id="desktop-sidebar-button"
            onClick={() => onClickTravelMode()}
            className={`w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl m-1 cursor-pointer border hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-colors duration-200 ${
              view === "travelMode"
                ? "bg-indigo-500 text-white"
                : "bg-indigo-100/70 text-indigo-900"
            }`}
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Travel Mode
            </span>
          </button>
        </div>
        {/* credits display */}
        <div className="flex flex-col items-center justify-center ">
          {credits != null && (
            <button
              type="button"
              onClick={onBuyCredits}
              title="Buy more credits"
              className={`text-sm w-full text-indigo-900 flex flex-col justify-center items-center bg-indigo-100/70 border rounded-xl m-1 p-2 py-1 shadow-md transition-colors duration-200 cursor-pointer hover:bg-indigo-500 hover:text-white hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                view === "buyCredits"
                  ? "border-indigo-600 ring-2 ring-indigo-400/50 bg-indigo-500 text-white"
                  : "border-indigo-900"
              }`}
            >
              <span className="text-base font-medium flex items-center gap-2">
                <Coins className="w-4 h-4" />
                Credits {isLoadingCredits ? "…" : credits}
              </span>
              <span className="text-xs mt-1 opacity-80">+ Buy more</span>
            </button>
          )}
        </div>
      </ul>
    </div>
  );
}

export default SideBar;
