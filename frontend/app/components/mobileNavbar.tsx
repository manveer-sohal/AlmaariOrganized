import temp from "../Logo.png";
import Image from "next/image";
import React, { Dispatch, SetStateAction, useState } from "react";
import { useClothesStore } from "../store/useClothesStore";
import { colours_List, type_List } from "../data/constants";
import { useCredits } from "../hooks/useCredits";
import { Settings } from "lucide-react";
import Dropdown from "../dashboard/components/Dropdown";
import { motion } from "framer-motion";
import CreditsBalanceButton from "./CreditsBalanceButton";

type NavBarProps = {
  onSearchTermChange?: Dispatch<SetStateAction<string>>;
  onBuyCredits: () => void;
};

function MobileNavBar({ onSearchTermChange, onBuyCredits }: NavBarProps) {
  const [search, setSearch] = useState("");
  const { filters, setFilters } = useClothesStore();
  const { credits, isLoadingCredits } = useCredits();
  const [showFeedback, setShowFeedback] = useState(false);
  const changeFilter = (value: string) => {
    const terms = value
      .trim()
      .toLowerCase()
      .split(" ");

    console.log(terms);

    const colour = [];
    const type = [];
    let count = 0;

    for (const term of terms) {
      if (term.length > 0) {
        if (colours_List.includes(term[0].toUpperCase() + term.slice(1))) {
          colour.push(term[0].toUpperCase() + term.slice(1));
          count++;
        } else if (type_List.includes(term[0].toUpperCase() + term.slice(1))) {
          type.push(term[0].toUpperCase() + term.slice(1));
          count++;
        }
      }
    }

    console.log(terms[count]);
    setFilters({
      ...filters,
      colour,
      type,
      search: terms.length == count ? "" : terms[count],
    });
    console.log(filters);
  };

  const handleChange = (value: string) => {
    setSearch(value);
    onSearchTermChange?.(value);
    changeFilter(value);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onSearchTermChange?.(search);
  };

  return (
    <>
      <nav className=" border-indigo-300 border-solid border-s-4 bg-indigo-400/90 h-full  p-2 sticky top-0 overflow-hidden z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center justify-end gap-2 h-full">
            <li id="icon" className="shrink-0">
              <Image src={temp.src} width={50} height={30} alt="logo"></Image>
            </li>

            {/* credits display */}
            <li className="shrink-0 min-w-[7.5rem]">
              <CreditsBalanceButton
                credits={credits}
                isLoading={isLoadingCredits}
                onBuyCredits={onBuyCredits}
                compact
              />
            </li>
          </div>
          <div className=" flex max-w-2xl">
            <li className="max-w-2xl">
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
          </div>
        </div>
        <div>
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Search clothes by type or colour..."
                className="w-full rounded-xl border border-indigo-300 bg-indigo-100/70 placeholder-indigo-700/70 text-indigo-900 px-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition"
              />
              <span className="absolute inset-y-0 left-3 flex items-center text-indigo-700/80">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 21l-4.3-4.3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
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
        </div>
      </nav>
    </>
  );
}

export default MobileNavBar;
