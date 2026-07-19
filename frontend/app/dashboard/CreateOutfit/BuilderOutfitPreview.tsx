"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ClothingItem, Slot } from "../../types/clothes";
import { SLOT_LABELS } from "../../types/aiStylist";
import BuilderSectionHeader from "./BuilderSectionHeader";
import { Anchor, Trash2 } from "lucide-react";
import { usePrefersReducedMotion } from "../../components/ux/motion";

const SLOT_ORDER: Slot[] = ["head", "body", "legs", "feet"];
const LONG_PRESS_MS = 250;
const MOVE_CANCEL_PX = 12;

/** Vertical band for each slot on the outfit canvas (top → bottom). */
const SLOT_LAYOUT: Record<
  Slot,
  { top: string; height: string; maxWidth: string; z: number }
> = {
  head: { top: "13%", height: "18%", maxWidth: "22%", z: 40 },
  body: { top: "26%", height: "28%", maxWidth: "62%", z: 30 },
  legs: { top: "44%", height: "36%", maxWidth: "83%", z: 20 },
  feet: { top: "73%", height: "20%", maxWidth: "48%", z: 10 },
};

/** Denser layout for Home featured look — uses more of the canvas. */
const FILL_SLOT_LAYOUT: Record<
  Slot,
  { top: string; height: string; maxWidth: string; z: number }
> = {
  head: { top: "1%", height: "16%", maxWidth: "34%", z: 40 },
  body: { top: "14%", height: "32%", maxWidth: "78%", z: 30 },
  legs: { top: "38%", height: "40%", maxWidth: "92%", z: 20 },
  feet: { top: "72%", height: "26%", maxWidth: "58%", z: 10 },
};

type DragState = {
  item: ClothingItem;
  x: number;
  y: number;
  overTrash: boolean;
  width: number;
  height: number;
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
  /** Fill the parent box (used on Home featured look). */
  fill?: boolean;
  titleOverride?: string;
  badgeOverride?: string;
  /** Anchor / unanchor every item currently in the preview. */
  onAnchorAllPreview?: () => void;
  className?: string;
};

function FittingRoomBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* Blush walls + depth toward center */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 55% 70% at 50% 42%, rgba(255,252,248,0.55) 0%, transparent 62%),
            linear-gradient(180deg, #e8cfc8 0%, #e2c4bc 42%, #d9b8b0 72%, #c9a8a0 100%)
          `,
        }}
      />
      {/* Soft window light at back */}
      <div
        className="absolute left-1/2 top-[6%] h-[28%] w-[34%] -translate-x-1/2 rounded-[40%] opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,248,235,0.95) 0%, rgba(255,236,210,0.35) 45%, transparent 72%)",
        }}
      />
      {/* Faint mirror oval suggestion */}
      <div className="absolute left-1/2 top-[10%] h-[18%] w-[22%] -translate-x-1/2 rounded-[50%] border border-[#c4a484]/35 bg-gradient-to-b from-white/25 to-transparent shadow-[inset_0_0_12px_rgba(255,255,255,0.35)]" />

      {/* Left curtain */}
      <div className="absolute inset-y-0 left-0 w-[18%] max-w-[3.25rem]">
        <div className="absolute left-1 right-0 top-[3%] h-[2px] rounded-full bg-gradient-to-r from-[#b8924a] to-[#d4b06a] opacity-90" />
        <div
          className="absolute inset-x-0 top-[4%] bottom-[8%] origin-top"
          style={{
            background: `
              repeating-linear-gradient(
                90deg,
                rgba(255,255,255,0.92) 0px,
                rgba(248,246,242,0.88) 3px,
                rgba(255,255,255,0.95) 6px,
                rgba(240,236,230,0.85) 9px
              )
            `,
            boxShadow: "4px 0 16px rgba(80,50,45,0.12)",
            borderRadius: "0 0 40% 0 / 0 0 8% 0",
            transform: "perspective(200px) rotateY(12deg)",
          }}
        />
      </div>

      {/* Right curtain */}
      <div className="absolute inset-y-0 right-0 w-[18%] max-w-[3.25rem]">
        <div className="absolute left-0 right-1 top-[3%] h-[2px] rounded-full bg-gradient-to-l from-[#b8924a] to-[#d4b06a] opacity-90" />
        <div
          className="absolute inset-x-0 top-[4%] bottom-[8%] origin-top"
          style={{
            background: `
              repeating-linear-gradient(
                90deg,
                rgba(255,255,255,0.92) 0px,
                rgba(248,246,242,0.88) 3px,
                rgba(255,255,255,0.95) 6px,
                rgba(240,236,230,0.85) 9px
              )
            `,
            boxShadow: "-4px 0 16px rgba(80,50,45,0.12)",
            borderRadius: "0 0 0 40% / 0 0 0 8%",
            transform: "perspective(200px) rotateY(-12deg)",
          }}
        />
      </div>

      {/* Sage carpet floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[22%]"
        style={{
          background: `
            linear-gradient(180deg, transparent 0%, rgba(168,186,168,0.35) 18%, #a8baa8 55%, #9aaf9a 100%)
          `,
        }}
      />
      {/* Soft vignette so clothes stay readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(90,60,55,0.08)_100%)]" />
    </div>
  );
}

function ModelStage({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 z-[2] -translate-x-1/2 ${
        compact ? "bottom-[3%] w-[48%]" : "bottom-[4%] w-[52%]"
      }`}
      aria-hidden="true"
    >
      {/* Floor shadow on carpet */}
      <div className="absolute -bottom-[2px] left-1/2 h-3 w-[95%] -translate-x-1/2 rounded-[100%] bg-black/20 blur-[4px]" />
      {/* Scalloped ottoman-inspired stage */}
      <div className={`relative mx-auto w-full ${compact ? "h-6" : "h-7"}`}>
        <div
          className="absolute inset-x-[4%] bottom-0 top-[40%] rounded-b-[45%]"
          style={{
            background:
              "linear-gradient(180deg, #c4a574 0%, #b08d5c 55%, #9a784c 100%)",
            boxShadow: "0 5px 12px rgba(70,45,25,0.22)",
          }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[68%] rounded-[100%]"
          style={{
            background:
              "radial-gradient(ellipse at 35% 30%, #e8d2a8 0%, #d4b888 40%, #c09a68 78%, #a88250 100%)",
            boxShadow:
              "inset 0 1px 2px rgba(255,255,255,0.45), 0 1px 3px rgba(70,45,25,0.18)",
          }}
        />
        <div className="absolute left-[16%] top-[12%] h-[26%] w-[36%] rounded-[100%] bg-white/25 blur-[1px]" />
      </div>
    </div>
  );
}

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
  onRemoveItem,
  readOnly = false,
  compact = false,
  fill = false,
  titleOverride,
  badgeOverride,
  onAnchorAllPreview,
  className = "",
}: BuilderOutfitPreviewProps) {
  const reduced = usePrefersReducedMotion();
  const trashRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const [dragItem, setDragItem] = useState<ClothingItem | null>(null);
  const [overTrash, setOverTrash] = useState(false);
  const [dragSize, setDragSize] = useState({ width: 96, height: 96 });
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

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

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current != null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const removeItem = useCallback(
    (item: ClothingItem) => {
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
    },
    [onRemoveItem, setSelectedBySlot],
  );

  const isOverTrash = useCallback((clientX: number, clientY: number) => {
    const el = trashRef.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const pad = 20;
    return (
      clientX >= rect.left - pad &&
      clientX <= rect.right + pad &&
      clientY >= rect.top - pad &&
      clientY <= rect.bottom + pad
    );
  }, []);

  const placeGhost = useCallback((clientX: number, clientY: number) => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    ghost.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -50%)`;
  }, []);

  const updateDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragRef.current) return;
      const nextOver = isOverTrash(clientX, clientY);
      dragRef.current = {
        ...dragRef.current,
        x: clientX,
        y: clientY,
        overTrash: nextOver,
      };
      placeGhost(clientX, clientY);
      setOverTrash((prev) => (prev === nextOver ? prev : nextOver));
    },
    [isOverTrash, placeGhost],
  );

  const endDrag = useCallback(
    (clientX: number, clientY: number) => {
      const current = dragRef.current;
      clearLongPress();
      activePointerIdRef.current = null;
      pointerStartRef.current = null;
      dragRef.current = null;
      setDragItem(null);
      setOverTrash(false);

      if (current && isOverTrash(clientX, clientY)) {
        removeItem(current.item);
      }
    },
    [clearLongPress, isOverTrash, removeItem],
  );

  const cancelDrag = useCallback(() => {
    clearLongPress();
    activePointerIdRef.current = null;
    pointerStartRef.current = null;
    dragRef.current = null;
    setDragItem(null);
    setOverTrash(false);
  }, [clearLongPress]);

  const startDrag = useCallback(
    (
      item: ClothingItem,
      x: number,
      y: number,
      width: number,
      height: number,
    ) => {
      const size = {
        width: Math.max(72, Math.min(140, width || 96)),
        height: Math.max(72, Math.min(160, height || 96)),
      };
      const next: DragState = {
        item,
        x,
        y,
        overTrash: false,
        width: size.width,
        height: size.height,
      };
      dragRef.current = next;
      setDragSize(size);
      setOverTrash(false);
      setDragItem(item);
      requestAnimationFrame(() => placeGhost(x, y));
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(12);
        } catch {
          /* ignore */
        }
      }
    },
    [placeGhost],
  );

  const onItemPointerDown = (
    item: ClothingItem,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (readOnly || event.button !== 0) return;
    clearLongPress();
    activePointerIdRef.current = event.pointerId;
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    const { clientX, clientY, pointerId } = event;
    const rect = event.currentTarget.getBoundingClientRect();

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTimerRef.current = null;
      if (activePointerIdRef.current !== pointerId) return;
      startDrag(item, clientX, clientY, rect.width, rect.height);
    }, LONG_PRESS_MS);
  };

  const onItemPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;

    if (dragRef.current) {
      event.preventDefault();
      updateDrag(event.clientX, event.clientY);
      return;
    }

    const start = pointerStartRef.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) {
      clearLongPress();
    }
  };

  const onItemPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (activePointerIdRef.current !== event.pointerId) return;
    if (dragRef.current) {
      endDrag(event.clientX, event.clientY);
      return;
    }
    clearLongPress();
    activePointerIdRef.current = null;
    pointerStartRef.current = null;
  };

  useEffect(() => {
    if (!dragItem) return;

    const onMove = (event: PointerEvent) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      event.preventDefault();
      updateDrag(event.clientX, event.clientY);
    };
    const onUp = (event: PointerEvent) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      endDrag(event.clientX, event.clientY);
    };
    const onCancel = () => cancelDrag();

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [dragItem, updateDrag, endDrag, cancelDrag]);

  useEffect(() => {
    if (!dragItem || !dragRef.current) return;
    placeGhost(dragRef.current.x, dragRef.current.y);
  }, [dragItem, placeGhost]);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  const draggingId = dragItem?._id ?? null;
  return (
    <div
      id={fill ? "featured-outfit-preview" : "outfit-preview"}
      className={`flex min-h-0 max-w-full flex-col rounded-2xl shadow-md backdrop-blur transition-shadow ${
        fill
          ? "h-full overflow-hidden  bg-transparent p-0 shadow-none backdrop-blur-none"
          : compact
            ? "h-full min-h-0 p-0"
            : "p-4"
      } ${
        highlightApplied ? "ring-2 ring-indigo-400 shadow-indigo-200/60" : ""
      } ${className}`}
    >
      {compact || fill ? null : (
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
          fill
            ? "h-full items-stretch justify-stretch gap-0"
            : compact
              ? "h-full items-center justify-center gap-0"
              : "mt-3 gap-3"
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-2xl ${
            fill
              ? "h-full w-full"
              : compact
                ? "h-full w-full max-h-full max-w-full"
                : "mx-auto w-full max-w-[280px] flex-1"
          } ${dragItem ? "touch-none select-none" : ""}`}
          style={compact || fill ? undefined : { minHeight: "420px" }}
          aria-label="Outfit canvas"
        >
          <FittingRoomBackdrop />
          <ModelStage compact={compact || fill} />

          {SLOT_ORDER.map((slot) => {
            const items = selectedBySlot[slot];
            const visibleItems = Array.isArray(items)
              ? items.filter((item) => item._id !== draggingId)
              : [];
            const hasItems = visibleItems.length > 0;
            const isSwapTarget =
              swapMode && (swapTargetSlot == null || swapTargetSlot === slot);
            const label = SLOT_LABELS[slot] || slot;
            const layout = (fill ? FILL_SLOT_LAYOUT : SLOT_LAYOUT)[slot];

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
                    {visibleItems.map((item, idx) => {
                      const layerCount = visibleItems.length;
                      const layerGap = fill ? 10 : 30;
                      const stackShiftPx =
                        idx * layerGap - ((layerCount - 1) * layerGap) / 2;

                      return (
                        <div
                          key={item._id}
                          className="absolute inset-0 overflow-hidden"
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
                                : `Hold and drag ${item.type} to remove from ${label}`
                            }
                            title={
                              readOnly
                                ? item.type
                                : "Hold, then drag to trash to remove"
                            }
                            onContextMenu={(e) => {
                              if (!readOnly) e.preventDefault();
                            }}
                            onPointerDown={(e) => onItemPointerDown(item, e)}
                            onPointerMove={onItemPointerMove}
                            onPointerUp={onItemPointerUp}
                            onPointerCancel={cancelDrag}
                            className={`relative h-full w-full overflow-hidden rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                              readOnly
                                ? "cursor-default"
                                : "touch-none hover:z-50 hover:scale-[1.04] hover:shadow-lg"
                            }`}
                          >
                            <Image
                              src={item.imageSrc}
                              alt={item.type}
                              fill
                              sizes="200px"
                              draggable={false}
                              className="pointer-events-none object-contain"
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : readOnly ? (
                  fill ? null : (
                    <div
                      className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl bg-white/40 text-indigo-300"
                      aria-label={`Empty ${label}`}
                    >
                      <SlotIcon slot={slot} />
                    </div>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => onReplaceSlot?.(slot)}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl  text-indigo-400 transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-600"
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
      </div>

      {portalReady
        ? createPortal(
            <AnimatePresence>
              {dragItem ? (
                <div key="outfit-drag-layer">
                  <motion.div
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.15 }}
                    className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] h-40 bg-gradient-to-t from-black/30 to-transparent"
                    aria-hidden
                  />
                  <motion.div
                    ref={trashRef}
                    role="img"
                    aria-label="Drop here to remove from outfit"
                    initial={
                      reduced
                        ? false
                        : { opacity: 0, y: 28, x: "-50%", scale: 0.85 }
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                      x: "-50%",
                      scale: overTrash ? 1.14 : 1,
                    }}
                    exit={
                      reduced
                        ? undefined
                        : { opacity: 0, y: 20, x: "-50%", scale: 0.9 }
                    }
                    transition={{
                      duration: reduced ? 0 : 0.16,
                      ease: "easeOut",
                    }}
                    className={`pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-[210] flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-2xl ${
                      overTrash
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-red-300 bg-white text-red-500"
                    }`}
                  >
                    <Trash2 className="h-7 w-7" aria-hidden />
                  </motion.div>
                  <div
                    ref={ghostRef}
                    className="pointer-events-none fixed left-0 top-0 z-[220] overflow-hidden rounded-xl bg-white/95 shadow-2xl ring-2 ring-white will-change-transform"
                    style={{
                      width: dragSize.width,
                      height: dragSize.height,
                      transform: "translate3d(-9999px,-9999px,0)",
                    }}
                    aria-hidden
                  >
                    <Image
                      src={dragItem.imageSrc}
                      alt=""
                      fill
                      sizes="140px"
                      draggable={false}
                      className="object-contain"
                    />
                  </div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
