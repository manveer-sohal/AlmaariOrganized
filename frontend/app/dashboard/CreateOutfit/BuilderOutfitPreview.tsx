"use client";

import Image from "next/image";
import { ClothingItem, Slot } from "../../types/clothes";
import { SLOT_LABELS } from "../../types/aiStylist";
import BuilderSectionHeader from "./BuilderSectionHeader";

const SLOT_ORDER: Slot[] = ["head", "body", "legs", "feet"];

type BuilderOutfitPreviewProps = {
  selectedBySlot: Partial<Record<Slot, ClothingItem[] | null>>;
  setSelectedBySlot: (
    selectedBySlot: (
      prev: Partial<Record<Slot, ClothingItem[] | null>>,
    ) => Partial<Record<Slot, ClothingItem[] | null>>,
  ) => void;
  swapMode?: boolean;
  swapTargetSlot?: Slot | null;
  onReplaceSlot?: (slot: Slot) => void;
  highlightApplied?: boolean;
  className?: string;
};

function SlotIcon({ slot }: { slot: Slot }) {
  if (slot === "head") {
    return (
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M32 4 C23 4 16 11 16 20 V28 C16 33 18.5 37.5 22.5 40.5 L27.5 44 H36.5 L41.5 40.5 C45.5 37.5 48 33 48 28 V20 C48 11 41 4 32 4 Z"
          stroke="#4f46e5"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (slot === "body") {
    return (
      <svg width="42" height="42" viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <path
          d="M24 10 L20 8 L12 24 V50 H22 V40 H42 V50 H52 V24 L44 8 L40 10"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (slot === "legs") {
    return (
      <svg width="36" height="44" viewBox="0 0 48 64" fill="none" aria-hidden="true">
        <path
          d="M14 8 H34 V50 H26 V20 H22 V50 H14 Z"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="40" height="32" viewBox="0 0 80 64" fill="none" aria-hidden="true">
      <path
        d="M24 20 V18 H40 V30 L44 36 C55 39 58 44 58 50 C58 55 54 58 49 58 H29 L24 58 V20"
        stroke="#4f46e5"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BuilderOutfitPreview({
  selectedBySlot,
  setSelectedBySlot,
  swapMode = false,
  swapTargetSlot = null,
  onReplaceSlot,
  highlightApplied = false,
  className = "",
}: BuilderOutfitPreviewProps) {
  const filledSlots = SLOT_ORDER.filter((slot) => {
    const items = selectedBySlot[slot];
    return Array.isArray(items) && items.length > 0;
  }).length;

  const removeItem = (item: ClothingItem) => {
    setSelectedBySlot((prev) => {
      const next = prev[item.slot]?.filter((c) => c._id !== item._id) ?? [];
      return {
        ...prev,
        [item.slot]: next.length > 0 ? next : null,
      };
    });
  };

  return (
    <div
      id="outfit-preview"
      className={`flex min-h-0 flex-col rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-md backdrop-blur transition-shadow ${
        highlightApplied ? "ring-2 ring-indigo-400 shadow-indigo-200/60" : ""
      } ${className}`}
    >
      <BuilderSectionHeader
        step="02"
        title="Outfit Preview"
        description="Select items manually or apply an AI suggestion."
        action={
          <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-800">
            {filledSlots} of 4 pieces
          </span>
        }
      />

      <div className="mt-4 flex flex-1 flex-col gap-2.5 overflow-y-auto">
        {SLOT_ORDER.map((slot) => {
          const items = selectedBySlot[slot];
          const hasItems = Array.isArray(items) && items.length > 0;
          const isSwapTarget =
            swapMode && (swapTargetSlot == null || swapTargetSlot === slot);
          const label = SLOT_LABELS[slot] || slot;

          return (
            <div
              key={slot}
              className={`rounded-xl border p-2.5 transition-colors ${
                isSwapTarget
                  ? "border-indigo-400 bg-indigo-50/80"
                  : "border-indigo-200 bg-white/70"
              }`}
            >
              {hasItems ? (
                <div className="flex items-center gap-3">
                  <div className="relative h-[85px] w-[85px] shrink-0 sm:h-[100px] sm:w-[100px]">
                    {items!.map((item, idx) => (
                      <button
                        key={item._id}
                        type="button"
                        aria-label={`Remove ${item.type} from ${label}`}
                        onClick={() => removeItem(item)}
                        className="absolute top-0 flex h-[85px] w-[85px] cursor-pointer items-center justify-center overflow-hidden rounded-md p-1 hover:z-10 hover:scale-105 hover:bg-indigo-50/50 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:h-[100px] sm:w-[100px]"
                        style={{
                          left: `${idx * 25}px`,
                          zIndex: idx + 1,
                        }}
                      >
                        <Image
                          src={item.imageSrc}
                          alt={item.type}
                          width={100}
                          height={100}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-indigo-900">
                      {label}
                    </p>
                    {onReplaceSlot ? (
                      <button
                        type="button"
                        onClick={() => onReplaceSlot(slot)}
                        className="mt-1.5 text-xs font-medium text-indigo-700 underline-offset-2 hover:text-indigo-900 hover:underline"
                      >
                        Replace
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-[85px] w-[85px] shrink-0 items-center justify-center rounded-md border border-indigo-200 bg-white sm:h-[100px] sm:w-[100px]">
                    <SlotIcon slot={slot} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-indigo-900">
                      {label}
                    </p>
                    <p className="text-xs text-indigo-700/70">Select an item</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
