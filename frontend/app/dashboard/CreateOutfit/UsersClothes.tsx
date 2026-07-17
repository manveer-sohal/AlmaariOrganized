"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ClothingItem, Slot } from "../../types/clothes";
import { SLOT_LABELS } from "../../types/aiStylist";
import { AnimatePresence } from "framer-motion";
import { RefObject } from "react";
import { Anchor } from "lucide-react";
import BuilderSectionHeader from "./BuilderSectionHeader";
import { humanizeClothingSubtype } from "../../utils/clothingSubtype";

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
  swapMode,
  swapTargetSlot,
  onCancelSwap,
  onAddClothes,
  anchoredItemIds = [],
  onToggleAnchor,
  embedded = false,
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
  swapMode?: boolean;
  swapTargetSlot?: Slot | null;
  onCancelSwap?: () => void;
  onAddClothes?: () => void;
  anchoredItemIds?: string[];
  onToggleAnchor?: (id: string) => void;
  /** Hide outer card chrome when nested in a drawer. */
  embedded?: boolean;
  className?: string;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const selectedIds = useMemo(() => {
    const ids = new Set<string>();
    selectedItems.forEach((group) =>
      group.forEach((item) => ids.add(item._id)),
    );
    return ids;
  }, [selectedItems]);

  const anchoredIds = useMemo(() => new Set(anchoredItemIds), [
    anchoredItemIds,
  ]);

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
      const subtypeLabel = humanizeClothingSubtype(item).toLowerCase();
      return (
        item.type.toLowerCase().includes(query) ||
        subtypeLabel.includes(query) ||
        colourText.toLowerCase().includes(query) ||
        (SLOT_LABELS[item.slot] || item.slot).toLowerCase().includes(query)
      );
    });
  }, [clothes, categoryFilter, searchQuery, swapMode, swapTargetSlot]);

  const replacementLabel = swapTargetSlot
    ? SLOT_LABELS[swapTargetSlot] || swapTargetSlot
    : null;

  return (
    <div
      id="create-outfit-form"
      className={
        embedded
          ? `relative flex min-h-0 flex-col ${className}`
          : `relative flex min-h-0 flex-col rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-md backdrop-blur ${className}`
      }
    >
      <div
        className={`shrink-0 space-y-3 ${
          embedded ? "" : "border-b border-indigo-100 pb-3"
        }`}
      >
        {embedded ? null : (
          <BuilderSectionHeader
            step="01"
            title="Your Clothes"
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
        )}

        {embedded ? (
          <div className="space-y-2">
            <label className="block">
              <span className="sr-only">Search your wardrobe</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your wardrobe..."
                className="h-11 w-full rounded-xl border border-indigo-200 bg-white px-3 text-sm text-indigo-900 placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </label>
            <select
              value={categoryFilter}
              onChange={(e) =>
                onCategoryFilterChange(e.target.value as Slot | "all")
              }
              aria-label="Filter by category"
              className="h-11 w-full rounded-xl border border-indigo-200 bg-white px-3 text-sm font-medium text-indigo-900"
            >
              <option value="all">All categories</option>
              <option value="body">Top</option>
              <option value="legs">Bottom</option>
              <option value="feet">Shoes</option>
              <option value="head">Accessories</option>
            </select>
          </div>
        ) : null}

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

        {embedded ? null : (
          <>
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
          </>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoadingClothes ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
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
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {filteredClothes.map((item: ClothingItem) => {
                const isSelected = selectedIds.has(item._id);
                const isAnchored = anchoredIds.has(item._id);
                const isAnchorHighlight = lastSelectedItemId === item._id;
                const subtypeLabel = humanizeClothingSubtype(item);

                return (
                  <div
                    key={item._id}
                    className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition ${
                      isAnchored
                        ? "border-indigo-600 bg-indigo-50 shadow-sm ring-1 ring-indigo-300"
                        : isSelected
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "border-indigo-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-sm"
                    } ${
                      isAnchorHighlight && !isSelected && !isAnchored
                        ? "border-amber-400 ring-1 ring-amber-300"
                        : ""
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-indigo-50/40">
                      <button
                        type="button"
                        onClick={() => toggleSelect(item._id)}
                        aria-pressed={isSelected}
                        aria-label={
                          isAnchored
                            ? `${subtypeLabel}, anchored — stays in future generations`
                            : subtypeLabel
                        }
                        className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
                      >
                        <Image
                          src={item.imageSrc}
                          alt={subtypeLabel}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 45vw, 160px"
                        />
                        <span className="absolute bottom-1.5 left-1.5 z-[1] max-w-[calc(100%-12px)] truncate rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 shadow-sm">
                          {subtypeLabel}
                        </span>
                        {isAnchored ? (
                          <span
                            className="absolute right-1.5 top-1.5 inline-flex items-center justify-center rounded-full bg-indigo-700 p-1 text-white shadow-sm"
                            title="This item will remain in future generations"
                          >
                            <Anchor className="h-3 w-3" aria-hidden />
                            <span className="sr-only">Anchored</span>
                          </span>
                        ) : isSelected ? (
                          <span className="absolute right-1.5 top-1.5 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                            In outfit
                          </span>
                        ) : null}
                        {!onToggleAnchor && isSelected && !isAnchored ? (
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
                      </button>
                      {onToggleAnchor ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleAnchor(item._id);
                          }}
                          aria-pressed={isAnchored}
                          aria-label={
                            isAnchored
                              ? `Unanchor ${subtypeLabel}`
                              : `Anchor ${subtypeLabel} for future generations`
                          }
                          title={
                            isAnchored
                              ? "Unanchor — unlock for future generations"
                              : "Anchor — keep in every future generation"
                          }
                          className={`absolute left-1.5 top-1.5 z-[2] inline-flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition ${
                            isAnchored
                              ? "border-indigo-700 bg-indigo-700 text-white"
                              : "border-indigo-200 bg-white/95 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50"
                          }`}
                        >
                          <Anchor className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      ) : null}
                    </div>
                    <div className="flex items-center px-2 py-1.5">
                      <span className="truncate text-[11px] font-medium text-indigo-900">
                        {SLOT_LABELS[item.slot] || item.slot}
                      </span>
                    </div>
                  </div>
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
