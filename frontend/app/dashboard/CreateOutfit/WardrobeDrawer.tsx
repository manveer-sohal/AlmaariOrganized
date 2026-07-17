"use client";

import { RefObject, useCallback } from "react";
import { ClothingItem, Slot } from "../../types/clothes";
import UsersClothes from "./UsersClothes";
import { useOverlayFocus } from "./useOverlayFocus";
import { X } from "lucide-react";

type WardrobeDrawerProps = {
  open: boolean;
  onClose: () => void;
  isLoadingClothes: boolean;
  error: Error | null;
  clothes: ClothingItem[];
  selectedItems: ClothingItem[][];
  toggleSelect: (id: string) => void;
  infiniteScrollRef: RefObject<HTMLDivElement>;
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
};

export default function WardrobeDrawer({
  open,
  onClose,
  isLoadingClothes,
  error,
  clothes,
  selectedItems,
  toggleSelect,
  infiniteScrollRef,
  hasNextPage,
  isFetchingNextPage,
  categoryFilter,
  onCategoryFilterChange,
  lastSelectedItemId,
  swapMode,
  swapTargetSlot,
  onCancelSwap,
  onAddClothes,
  anchoredItemIds,
  onToggleAnchor,
}: WardrobeDrawerProps) {
  const handleClose = useCallback(() => {
    onCancelSwap?.();
    onClose();
  }, [onCancelSwap, onClose]);
  const containerRef = useOverlayFocus(open, handleClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close wardrobe"
        onClick={handleClose}
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wardrobe-drawer-title"
        className="absolute inset-y-0 left-0 flex w-[90vw] max-w-[400px] flex-col border-r border-indigo-200 bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-indigo-100 px-4 py-3">
          <div>
            <h2
              id="wardrobe-drawer-title"
              className="text-lg font-semibold text-indigo-900"
            >
              Your Clothes
            </h2>
            <p className="mt-0.5 text-xs text-indigo-700/80">
              {swapMode
                ? swapTargetSlot
                  ? `Replacing: ${swapTargetSlot}`
                  : "Choose a replacement"
                : "Choose items for your outfit."}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-600 px-3 text-sm font-semibold text-white"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close wardrobe"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-200 text-indigo-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-3">
          <UsersClothes
            isLoadingClothes={isLoadingClothes}
            error={error}
            clothes={clothes}
            selectedItems={selectedItems}
            toggleSelect={toggleSelect}
            ref={infiniteScrollRef}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={onCategoryFilterChange}
            lastSelectedItemId={lastSelectedItemId}
            swapMode={swapMode}
            swapTargetSlot={swapTargetSlot}
            onCancelSwap={onCancelSwap}
            onAddClothes={onAddClothes}
            anchoredItemIds={anchoredItemIds}
            onToggleAnchor={onToggleAnchor}
            className="h-full"
            embedded
          />
        </div>
      </div>
    </div>
  );
}
