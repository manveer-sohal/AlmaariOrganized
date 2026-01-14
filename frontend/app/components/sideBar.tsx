import ChooseColour from "./chooseColour";
import ValidateType from "./validateType";
import React, { useState } from "react";
import WeatherCheck from "./weatherCheck";
import { useClothesStore } from "../store/useClothesStore";
import { goToNextTourStepOutfit } from "./OnBoardingTourOutfit";
//  onQuery: (Dispatch<SetStateAction<{ colour: string[] | undefined; type: string[] | undefined; } | undefined>>) => void;
type View = "home" | "outfits" | "createOutfit" | "addClothes";
type SideBarProp = {
  view: View;
  setView: (view: View) => void;
};
function SideBar({ view, setView }: SideBarProp) {
  const [active, setActive] = useState<boolean>(false);
  const [displayFilterType, setDisplayFilterType] = useState<string>("none");
  const [colour, setColour] = useState<string[] | null | undefined>([]);
  const [type, setType] = useState<string[] | null | undefined>([]);
  const { filters, setFilters } = useClothesStore();

  const changeFilter = (colour: string[], type: string[]) => {
    setFilters({ ...filters, colour, type });
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

  const handleSubmit = () => {
    console.log("apply");

    changeFilter(colour ?? [], type ?? []);

    onClickFilter();
  };
  return (
    <>
      <ul className="border-indigo-300 border-l-4 p-3 h-[92.3vh] text-center bg-indigo-400/100  py-[2.1vh] flex flex-col min-w-[150px] shadow-md ">
        <li>
          <button
            onClick={() => onClickHome()}
            className={`w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl m-1 cursor-pointer border ${
              view === "home"
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
            className={`w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2.5 rounded-xl m-1 cursor-pointer border ${
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
            <div className="relative bg-white/80 backdrop-blur border border-indigo-200 shadow-md p-3 rounded-lg">
              <ChooseColour colour={setColour}></ChooseColour>
              <ValidateType type={setType}></ValidateType>
            </div>

            <button
              className="w-1/2 inline-flex items-center justify-center gap-2 font-medium px-4 py-2 rounded-xl m-1 cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors duration-200"
              onClick={handleSubmit}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Apply</span>
            </button>
          </div>
        </li>
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
          className={`w-full inline-flex items-center justify-center gap-2 font-medium text-base px-4 py-2 rounded-xl m-1 cursor-pointer border ${
            view === "createOutfit"
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
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>Create Outfit</span>
        </button>
      </ul>
    </>
  );
}

export default SideBar;
