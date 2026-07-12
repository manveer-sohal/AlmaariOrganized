"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ClothingItem, Slot } from "../../types/clothes";
import { SLOT_LABELS } from "../../types/aiStylist";
import { AnimatePresence } from "framer-motion";
import { RefObject } from "react";
import BuilderSectionHeader from "./BuilderSectionHeader";

const UsersClothes = ({
  isLoadingClothes,
  error,
  clothes,
  selectedItems,
  toggleSelect,
  ref,
  hasNextPage,
  isFetchingNextPage,
  categoryFilter,
  onCategoryFilterChange,
  lastSelectedItemId,
  onStyleThisItem,
  swapMode,
  swapTargetSlot,
  onCancelSwap,
  onAddClothes,
  className = "",
}: {
  isLoadingClothes: boolean;
  error: Error | null;
  clothes: ClothingItem[];
  selectedItems: ClothingItem[][];
  toggleSelect: (id: string) => void;
  ref: RefObject<HTMLDivElement>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  categoryFilter: Slot | "all";
  onCategoryFilterChange: (value: Slot | "all") => void;
  lastSelectedItemId?: string | null;
  onStyleThisItem: () => void;
  swapMode?: boolean;
  swapTargetSlot?: Slot | null;
  onCancelSwap?: () => void;
  onAddClothes?: () => void;
  className?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const selectedIds = useMemo(() => {
    const ids = new Set<string>();
    selectedItems.forEach((group) => group.forEach((item) => ids.add(item._id)));
    return ids;
  }, [selectedItems]);

  const filteredClothes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return clothes.filter((item) => {
      if (categoryFilter !== "all" && item.slot !== categoryFilter) {
        return false;
      }
      if (swapMode && swapTargetSlot && item.slot !== swapTargetSlot) {
        return false;
      }
      if (!query) return true;
      const colourText = Array.isArray(item.colour)
        ? item.colour.join(" ")
        : "";
      return (
        item.type.toLowerCase().includes(query) ||
        colourText.toLowerCase().includes(query) ||
        (SLOT_LABELS[item.slot] || item.slot).toLowerCase().includes(query)
      );
    });
  }, [clothes, categoryFilter, searchQuery, swapMode, swapTargetSlot]);

  const hasSelection = selectedItems.some((group) => group.length > 0);
  const replacementLabel = swapTargetSlot
    ? SLOT_LABELS[swapTargetSlot] || swapTargetSlot
    : null;

  return (
    <div
      id="create-outfit-form"
      className={`relative flex min-h-0 flex-col rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-md backdrop-blur ${className}`}
    >
      <div className="shrink-0 space-y-3 border-b border-indigo-100 pb-3">
        <BuilderSectionHeader
          step="01"
          title="Your Clothes"
          description={
            swapMode
              ? undefined
              : "Choose an item to add or replace it in your outfit."
          }
          action={
            <select
              value={categoryFilter}
              onChange={(e) =>
                onCategoryFilterChange(e.target.value as Slot | "all")
              }
              aria-label="Filter by category"
              className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-medium text-indigo-900"
            >
              <option value="all">All categories</option>
              <option value="body">Top</option>
              <option value="legs">Bottom</option>
              <option value="feet">Shoes</option>
              <option value="head">Accessories</option>
            </select>
          }
        />

        {swapMode ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-2">
            <p className="text-xs font-medium text-indigo-900 sm:text-sm">
              {replacementLabel
                ? `Replacing: ${replacementLabel}`
                : "Choose a replacement"}
            </p>
            {onCancelSwap ? (
              <button
                type="button"
                onClick={onCancelSwap}
                className="shrink-0 rounded-lg border border-indigo-300 bg-white px-2.5 py-1 text-xs font-medium text-indigo-800 hover:bg-indigo-100"
              >
                Cancel
              </button>
            ) : null}
          </div>
        ) : null}

        <label className="block">
          <span className="sr-only">Search your wardrobe</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your wardrobe..."
            className="h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 text-sm text-indigo-900 placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-medium text-indigo-700/80">
            {categoryFilter === "all"
              ? "All categories"
              : SLOT_LABELS[categoryFilter]}
            {" · "}
            {filteredClothes.length}{" "}
            {filteredClothes.length === 1 ? "item" : "items"}
          </p>
          {hasSelection && !swapMode ? (
            <button
              type="button"
              onClick={onStyleThisItem}
              className="inline-flex min-h-9 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-100/70 px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-500 hover:text-white sm:text-sm"
            >
              Style this item
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoadingClothes ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }, (_, index) => (
              <div
                key={index}
                className="aspect-square w-full overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/50"
              >
                <div className="h-full w-full animate-pulse bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-700">
            Error loading clothes
          </p>
        ) : clothes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <p className="text-sm font-semibold text-indigo-900">
              Your wardrobe is empty
            </p>
            <p className="max-w-xs text-xs text-indigo-700/75">
              Add clothing items before building an outfit.
            </p>
            {onAddClothes ? (
              <button
                type="button"
                onClick={onAddClothes}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Add Clothes
              </button>
            ) : null}
          </div>
        ) : filteredClothes.length === 0 ? (
          <p className="py-8 text-center text-sm text-indigo-800">
            No items match your filters.
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredClothes.map((item: ClothingItem) => {
                const isSelected = selectedIds.has(item._id);
                const isAnchorHighlight = lastSelectedItemId === item._id;
                const inOutfit = isSelected;

                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => toggleSelect(item._id)}
                    aria-pressed={isSelected}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "border-indigo-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm"
                    } ${isAnchorHighlight && !isSelected ? "border-amber-400 ring-1 ring-amber-300" : ""}`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-indigo-50/40">
                      <Image
                        src={item.imageSrc}
                        alt={`${item.type}${Array.isArray(item.colour) && item.colour[0] ? `, ${item.colour[0]}` : ""}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 45vw, 160px"
                      />
                      {isSelected ? (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                          Selected
                        </span>
                      ) : inOutfit ? null : null}
                      {isSelected ? (
                        <span
                          className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white"
                          aria-hidden="true"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2.5 6.2 L4.8 8.5 L9.5 3.5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                      <span className="truncate text-[11px] font-medium text-indigo-900">
                        {SLOT_LABELS[item.slot] || item.slot}
                      </span>
                      {inOutfit ? (
                        <span className="shrink-0 text-[10px] font-medium text-indigo-600">
                          In outfit
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
              {isFetchingNextPage &&
                Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={`loading-${index}`}
                    className="aspect-square w-full overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/50"
                  >
                    <div className="h-full w-full animate-pulse bg-gradient-to-r from-indigo-100 via-indigo-50 to-indigo-100" />
                  </div>
                ))}
            </div>
          </AnimatePresence>
        )}
        {hasNextPage && <div ref={ref} className="h-10 w-full" />}
      </div>
    </div>
  );
};

export default UsersClothes;
