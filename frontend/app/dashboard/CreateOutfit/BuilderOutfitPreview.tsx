"use client";

import Image from "next/image";
import { ClothingItem, Slot } from "../../types/clothes";
import { SLOT_LABELS } from "../../types/aiStylist";
import BuilderSectionHeader from "./BuilderSectionHeader";
// import { isBeltItem } from "../../utils/layeringDisplay";
// import { humanizeClothingSubtype } from "../../utils/clothingSubtype";
import { Anchor } from "lucide-react";

const SLOT_ORDER: Slot[] = ["head", "body", "legs", "feet"];

/** Vertical band for each slot on the outfit canvas (top → bottom). */
const SLOT_LAYOUT: Record<
  Slot,
  { top: string; height: string; maxWidth: string; z: number }
> = {
  head: { top: "2%", height: "18%", maxWidth: "22%", z: 40 },
  body: { top: "14%", height: "38%", maxWidth: "62%", z: 30 },
  legs: { top: "46%", height: "36%", maxWidth: "68%", z: 20 },
  feet: { top: "78%", height: "20%", maxWidth: "48%", z: 10 },
};

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
  anchoredItemIds?: string[];
  onToggleAnchor?: (id: string) => void;
  /** Prefer this over setSelectedBySlot alone so anchors stay in sync. */
  onRemoveItem?: (id: string) => void;
  /** Display-only mode for AI carousel slides (no remove / empty-slot pick). */
  readOnly?: boolean;
  /** Tighter layout for mobile AI carousel (shorter canvas, less chrome). */
  compact?: boolean;
  titleOverride?: string;
  badgeOverride?: string;
  /** Anchor / unanchor every item currently in the preview. */
  onAnchorAllPreview?: () => void;
  className?: string;
};

function SlotIcon({ slot }: { slot: Slot }) {
  if (slot === "head") {
    return (
      <svg
        width="28"
        height="28"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
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
      <svg
        width="30"
        height="30"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
      >
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
      <svg
        width="24"
        height="32"
        viewBox="0 0 48 64"
        fill="none"
        aria-hidden="true"
      >
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
    <svg
      width="28"
      height="22"
      viewBox="0 0 80 64"
      fill="none"
      aria-hidden="true"
    >
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
  anchoredItemIds = [],
  // onToggleAnchor,
  onRemoveItem,
  readOnly = false,
  compact = false,
  titleOverride,
  badgeOverride,
  onAnchorAllPreview,
  className = "",
}: BuilderOutfitPreviewProps) {
  const anchoredIds = new Set(anchoredItemIds);
  const filledSlots = SLOT_ORDER.filter((slot) => {
    const items = selectedBySlot[slot];
    return Array.isArray(items) && items.length > 0;
  }).length;

  const pieceCount = SLOT_ORDER.reduce((sum, slot) => {
    const items = selectedBySlot[slot];
    return sum + (Array.isArray(items) ? items.length : 0);
  }, 0);

  const previewItemIds = SLOT_ORDER.flatMap((slot) => {
    const items = selectedBySlot[slot];
    return Array.isArray(items) ? items.map((item) => item._id) : [];
  });
  const allPreviewAnchored =
    previewItemIds.length > 0 &&
    previewItemIds.every((id) => anchoredIds.has(id));

  // const bodyLayers = selectedBySlot.body || [];
  // const showBodyLayerList = Array.isArray(bodyLayers) && bodyLayers.length > 1;

  // const legItems = selectedBySlot.legs || [];
  // const headItems = selectedBySlot.head || [];
  // const beltItems = [
  //   ...(Array.isArray(headItems) ? headItems.filter(isBeltItem) : []),
  //   ...(Array.isArray(legItems) ? legItems.filter(isBeltItem) : []),
  // ];
  // const nonBeltLegs = Array.isArray(legItems)
  //   ? legItems.filter((item) => !isBeltItem(item))
  //   : [];
  // const showBottomWaist = nonBeltLegs.length > 0 || beltItems.length > 0;

  const removeItem = (item: ClothingItem) => {
    if (onRemoveItem) {
      onRemoveItem(item._id);
      return;
    }
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
      className={`flex min-h-0 flex-col rounded-2xl border border-indigo-200 bg-white/80 shadow-md backdrop-blur transition-shadow ${
        compact ? "p-3" : "p-4"
      } ${
        highlightApplied ? "ring-2 ring-indigo-400 shadow-indigo-200/60" : ""
      } ${className}`}
    >
      {compact ? null : (
        <BuilderSectionHeader
          step="02"
          title={titleOverride || "Outfit Preview"}
          action={
            onAnchorAllPreview && pieceCount > 0 && !readOnly ? (
              <button
                type="button"
                onClick={onAnchorAllPreview}
                className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  allPreviewAnchored
                    ? "border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border-indigo-400 bg-white text-indigo-800 hover:bg-indigo-50"
                }`}
                title={
                  allPreviewAnchored
                    ? "Unlock every item in the outfit preview"
                    : "Lock every item currently in the outfit preview"
                }
              >
                <Anchor className="h-3.5 w-3.5" aria-hidden />
                {allPreviewAnchored ? "Unanchor preview" : "Anchor preview"}
              </button>
            ) : (
              <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-800">
                {badgeOverride
                  ? badgeOverride
                  : pieceCount > filledSlots
                  ? `${pieceCount} pieces · ${filledSlots} slots`
                  : `${filledSlots} of 4 pieces`}
              </span>
            )
          }
        />
      )}

      <div
        className={`flex min-h-0 flex-1 flex-col ${
          compact ? "h-full items-center justify-center gap-0" : "mt-3 gap-3"
        }`}
      >
        {/* Single outfit canvas — pieces layered top → bottom */}
        <div
          className={`relative overflow-hidden rounded-2xl border bg-white shadow-inner ${
            compact
              ? "aspect-[3/4] h-full max-h-full w-auto max-w-[min(100%,240px)]"
              : "mx-auto w-full max-w-[280px] flex-1"
          } ${highlightApplied ? "border-indigo-300" : "border-indigo-100"}`}
          style={compact ? undefined : { minHeight: "420px" }}
          aria-label="Outfit canvas"
        >
          {/* Soft mannequin guide */}
          <div
            className="pointer-events-none absolute inset-x-[28%] top-[8%] bottom-[6%] rounded-full"
            aria-hidden="true"
          />

          {SLOT_ORDER.map((slot) => {
            const items = selectedBySlot[slot];
            const hasItems = Array.isArray(items) && items.length > 0;
            const isSwapTarget =
              swapMode && (swapTargetSlot == null || swapTargetSlot === slot);
            const label = SLOT_LABELS[slot] || slot;
            const layout = SLOT_LAYOUT[slot];

            return (
              <div
                key={slot}
                className={`absolute left-1/2 flex -translate-x-1/2 items-center justify-center transition-all ${
                  isSwapTarget
                    ? "rounded-xl ring-2 ring-indigo-400 ring-offset-2 ring-offset-white"
                    : ""
                }`}
                style={{
                  top: layout.top,
                  height: layout.height,
                  width: layout.maxWidth,
                  zIndex: layout.z,
                }}
              >
                {hasItems ? (
                  <div className="relative h-full w-full">
                    {items!.map((item, idx) => {
                      const layerCount = items!.length;
                      // Each layer shifts 30px right; center the whole stack in the slot.
                      const stackShiftPx =
                        idx * 30 - ((layerCount - 1) * 30) / 2;

                      return (
                        <div
                          key={item._id}
                          className="absolute inset-0"
                          style={{
                            transform: `translateX(${stackShiftPx}px)`,
                            zIndex: idx + 1,
                          }}
                        >
                          <button
                            type="button"
                            aria-label={
                              readOnly
                                ? `${item.type} in ${label}`
                                : `Remove ${item.type} from ${label}`
                            }
                            title={
                              readOnly ? item.type : `Click to remove ${label}`
                            }
                            onClick={() => {
                              if (!readOnly) removeItem(item);
                            }}
                            className={`relative h-full w-full overflow-hidden rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                              readOnly
                                ? "cursor-default"
                                : "hover:z-50 hover:scale-[1.04] hover:shadow-lg"
                            }`}
                          >
                            <Image
                              src={item.imageSrc}
                              alt={item.type}
                              fill
                              sizes="200px"
                              className="object-contain"
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : readOnly ? (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-white/40 text-indigo-300"
                    aria-label={`Empty ${label}`}
                  >
                    <SlotIcon slot={slot} />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReplaceSlot?.(slot)}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-white/40 text-indigo-400 transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-600"
                    aria-label={`Select ${label}`}
                  >
                    <SlotIcon slot={slot} />
                    <span className="text-[10px] font-medium uppercase tracking-wide">
                      {label}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* {showBodyLayerList && !compact && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
              Upper body layers
            </p>
            <ul className="mt-1 space-y-0.5">
              {bodyLayers!.map((item, index) => {
                const roleLabel =
                  index === 0
                    ? "Base"
                    : index === bodyLayers!.length - 1 && bodyLayers!.length > 2
                    ? "Outer"
                    : "Mid layer";
                const isAnchored = anchoredIds.has(item._id);
                return (
                  <li
                    key={item._id}
                    className="flex items-center justify-between gap-2 text-xs text-indigo-900"
                  >
                    <span>
                      <span className="font-medium text-indigo-600">
                        {roleLabel}:
                      </span>{" "}
                      {humanizeClothingSubtype(item)}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1.5">
                      {onToggleAnchor ? (
                        <button
                          type="button"
                          onClick={() => onToggleAnchor(item._id)}
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                            isAnchored
                              ? "bg-indigo-700 text-white"
                              : "border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                          }`}
                          title={
                            isAnchored
                              ? "Unanchor this piece"
                              : "Anchor this piece"
                          }
                        >
                          <Anchor className="h-3 w-3" aria-hidden />
                          {isAnchored ? "Anchored" : "Anchor"}
                        </button>
                      ) : isAnchored ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-indigo-700">
                          <Anchor className="h-3 w-3" aria-hidden />
                          Anchored
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )} */}

        {/* {showBottomWaist && !compact && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
              Bottom & waist
            </p>
            <ul className="mt-1 space-y-0.5">
              {nonBeltLegs.map((item) => (
                <li key={item._id} className="text-xs text-indigo-900">
                  <span className="font-medium text-indigo-600">Bottom:</span>{" "}
                  {humanizeClothingSubtype(item)}
                </li>
              ))}
              {beltItems.map((item) => (
                <li key={item._id} className="text-xs text-indigo-900">
                  <span className="font-medium text-indigo-600">Belt:</span>{" "}
                  {humanizeClothingSubtype(item)}
                </li>
              ))}
            </ul>
          </div>
        )} */}
      </div>
    </div>
  );
}
