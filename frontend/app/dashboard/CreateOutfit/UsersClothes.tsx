import Image from "next/image";
import { ClothingItem, Slot } from "../../types/clothes";
import { SLOT_LABELS } from "../../types/aiStylist";
import LoadingClothesCard from "../components/loadingclothesCard";
import { AnimatePresence } from "framer-motion";
import { RefObject } from "react";

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
}) => {
  const filteredClothes =
    categoryFilter === "all"
      ? clothes
      : clothes.filter((item) => item.slot === categoryFilter);

  const hasSelection = selectedItems.some((group) => group.length > 0);

  return (
    <div
      id="create-outfit-form"
      className="bg-white/80 backdrop-blur flex flex-col border border-indigo-200 rounded-xl p-3 shadow-md lg:h-[calc(100vh-200px)] lg:min-h-0 relative"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-indigo-900">Your Clothes</h3>
        <select
          value={categoryFilter}
          onChange={(e) =>
            onCategoryFilterChange(e.target.value as Slot | "all")
          }
          className="rounded-lg border border-indigo-200 px-2 py-1 text-xs text-indigo-900"
        >
          <option value="all">All categories</option>
          <option value="body">Top</option>
          <option value="legs">Bottom</option>
          <option value="feet">Shoes</option>
          <option value="head">Accessories</option>
        </select>
      </div>

      {swapMode && (
        <p className="mb-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs text-indigo-800">
          Swap mode: select a wardrobe item to replace a piece in your current
          outfit preview.
        </p>
      )}

      {hasSelection && (
        <button
          type="button"
          onClick={onStyleThisItem}
          className="mb-3 inline-flex items-center justify-center rounded-xl border border-indigo-300 bg-indigo-100/70 px-3 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-500 hover:text-white"
        >
          Style this item
        </button>
      )}

      <div className="overflow-y-auto hidden-scrollbar lg:flex-1 lg:min-h-0">
        {isLoadingClothes ? (
          <div className="grid grid-cols-[repeat(auto-fill,_80px)] md:grid-cols-[repeat(auto-fill,_110px)] gap-3 justify-center max-h-[200px] sm:max-h-[500px] md:max-h-[800px]">
            {Array.from({ length: 20 }, (_, index) => (
              <LoadingClothesCard key={index} index={index} smaller={true} />
            ))}
          </div>
        ) : error ? (
          <p className="text-xl">Error loading clothes</p>
        ) : clothes.length === 0 ? (
          <p className="text-xl">Add Some Clothes!</p>
        ) : filteredClothes.length === 0 ? (
          <p className="text-sm text-indigo-800">
            No items in this category yet.
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-[repeat(auto-fill,_80px)] md:grid-cols-[repeat(auto-fill,_110px)] gap-3 justify-center max-h-[200px] sm:max-h-[500px] md:max-h-[800px]">
              {filteredClothes.map((item: ClothingItem) => {
                const isSelected = selectedItems.some((s) =>
                  s.some((c) => c._id === item._id),
                );
                const isAnchorHighlight = lastSelectedItemId === item._id;

                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => toggleSelect(item._id)}
                    className={`relative border rounded-lg overflow-hidden md:h-[120px] md:w-[120px] h-[80px] w-[80px] ${
                      isSelected
                        ? "ring-2 ring-indigo-500"
                        : "border-indigo-200"
                    } ${isAnchorHighlight ? "ring-2 ring-amber-400" : ""}`}
                  >
                    <Image
                      src={item.imageSrc}
                      alt={item.type}
                      width={120}
                      height={120}
                      className="object-cover h-full w-full"
                    />
                    <span className="absolute bottom-1 left-1 bg-white/80 text-indigo-900 text-[10px] px-1.5 py-0.5 rounded">
                      {SLOT_LABELS[item.slot] || item.slot}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
              {isFetchingNextPage &&
                Array.from({ length: 20 }, (_, index) => (
                  <LoadingClothesCard
                    key={index}
                    index={index}
                    smaller={true}
                  />
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
