import temp from "../Logo.png";
import Image from "next/image";
import React, { Dispatch, SetStateAction, useState } from "react";
import { useClothesStore } from "../store/useClothesStore";
import { View } from "../types/clothes";
import {
  colours_List,
  type_List,
  materials_List,
  fits_List,
  patterns_List,
} from "../data/constants";
import { goToNextTourStep } from "./OnBoardingTour";
import Dropdown from "../dashboard/components/Dropdown";
import { Search, Settings, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion } from "framer-motion";
type NavBarProps = {
  onSearchTermChange?: Dispatch<SetStateAction<string>>;
  setView: (view: View) => void;
};

function NavBar({ onSearchTermChange, setView }: NavBarProps) {
  const [search, setSearch] = useState("");
  const { filters, setFilters, menuOpen, setMenuOpen } = useClothesStore();
  const [showFeedback, setShowFeedback] = useState(false);
  const changeFilter = (value: string) => {
    const terms = value
      .trim()
      .toLowerCase()
      .split(" ");

    console.log(terms);

    const colour: string[] = [];
    const type: string[] = [];
    const material: string[] = [];
    const fit: string[] = [];
    const pattern: string[] = [];
    let count = 0;

    const capitalize = (term: string) => term[0].toUpperCase() + term.slice(1);

    for (const term of terms) {
      if (term.length > 0) {
        const formatted = capitalize(term);
        if (colours_List.includes(formatted)) {
          colour.push(formatted);
          count++;
        } else if (type_List.includes(formatted)) {
          type.push(formatted);
          count++;
        } else if (materials_List.includes(formatted)) {
          material.push(formatted);
          count++;
        } else if (fits_List.includes(formatted)) {
          fit.push(formatted);
          count++;
        } else if (patterns_List.includes(formatted)) {
          pattern.push(formatted);
          count++;
        }
      }
    }

    console.log(terms[count]);
    setFilters({
      ...filters,
      colour,
      type,
      material,
      fit,
      pattern,
      search: terms.length == count ? "" : terms[count],
    });
    console.log(filters);
  };

  const handleChange = (value: string) => {
    setSearch(value);
    onSearchTermChange?.(value);
    changeFilter(value);
  };
  const onClickAddClothes = () => {
    setView("addClothes");
    goToNextTourStep();
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSearchTermChange?.(search);
  };

  return (
    <>
      <nav className="border-indigo-300 border-solid border-s-4 w-full bg-indigo-400 h-16 p-2 sticky top-0 z-20 flex items-center gap-2">
        <button
          type="button"
          aria-label={menuOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={menuOpen}
          aria-controls="desktop-sidebar"
          title={menuOpen ? "Hide sidebar" : "Show sidebar"}
          onClick={() => setMenuOpen(!menuOpen)}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors"
        >
          {menuOpen ? (
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          ) : (
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          )}
        </button>
        <li
          id="icon"
          className="shrink-0 list-none cursor-pointer hover:bg-indigo-500  rounded-full p-1"
          onClick={() => setView("home")}
        >
          <Image src={temp.src} width={50} height={30} alt="logo"></Image>
        </li>
        <ul className="flex flex-1 items-center justify-end lg:justify-between gap-2 h-full">
          <li className="flex-1 max-w-2xl mx-2 lg:ml-40">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleChange(e.target.value)}
                  placeholder="Search by type, colour, material, fit, or pattern..."
                  className="w-full rounded-xl border border-indigo-300 bg-indigo-100/70 placeholder-indigo-700/70 text-indigo-900 px-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition"
                />
                <span className="absolute inset-y-0 left-3 flex items-center text-indigo-700/80">
                  <Search className="w-4 h-4" />
                </span>
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => handleChange("")}
                    className="absolute inset-y-0 right-3 flex items-center text-indigo-700/80 hover:text-indigo-900"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 6l12 12M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </li>

          <li className="shrink-0">
            <button
              id="add-clothes-btn-desktop"
              onClick={onClickAddClothes}
              title="Add Clothes"
              className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
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
              <span>Add Clothes</span>
            </button>

            <div
              className={`inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300 ${
                showFeedback
                  ? "bg-indigo-500 text-white"
                  : "bg-indigo-100/70 text-indigo-900"
              }`}
              onClick={() => setShowFeedback(!showFeedback)}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  className="z-50 fixed right-0 top-16"
                >
                  <Dropdown />
                </motion.div>
              )}
            </div>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default NavBar;
