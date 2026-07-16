"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import { useClothesStore } from "../store/useClothesStore";
import { colours_List, type_List } from "../data/constants";
import { Search, X } from "lucide-react";

type MobileSearchBarProps = {
  onSearchTermChange?: Dispatch<SetStateAction<string>>;
  /** Search is only available on the home wardrobe screen */
  enabled?: boolean;
};

function MobileSearchBar({
  onSearchTermChange,
  enabled = true,
}: MobileSearchBarProps) {
  const [search, setSearch] = useState("");
  const { filters, setFilters } = useClothesStore();

  const changeFilter = (value: string) => {
    const terms = value.trim().toLowerCase().split(" ");
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

    setFilters({
      ...filters,
      colour,
      type,
      search: terms.length == count ? "" : terms[count],
    });
  };

  const handleChange = (value: string) => {
    setSearch(value);
    onSearchTermChange?.(value);
    changeFilter(value);
  };

  if (!enabled) return null;

  return (
    <div className="border-indigo-300 border-solid border-s-4 bg-indigo-400/90 p-2 sticky top-0 z-20">
      <form
        className="relative w-full min-w-0"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchTermChange?.(search);
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by type or colour..."
          className="w-full rounded-xl border border-indigo-300 bg-indigo-100/70 placeholder-indigo-700/70 text-indigo-900 pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition"
        />
        <span className="absolute inset-y-0 left-3 flex items-center text-indigo-700/80 pointer-events-none">
          <Search className="h-4 w-4" aria-hidden />
        </span>
        {search ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => handleChange("")}
            className="absolute inset-y-0 right-2 flex items-center justify-center rounded-lg px-1.5 text-indigo-700/80 hover:text-indigo-900"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </form>
    </div>
  );
}

export default MobileSearchBar;
