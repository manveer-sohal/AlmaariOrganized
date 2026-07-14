"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ClothingItem, Slot } from "../../types/clothes";
import {
  OutfitRecommendation,
  SLOT_LABELS,
  STYLIST_MODE_META,
  StylistMode,
} from "../../types/aiStylist";
import { stylistNegativeReasons_List } from "../../data/constants";
import BuilderSectionHeader from "./BuilderSectionHeader";
import {
  buildBeltDisplayRow,
  buildLayerDisplayRows,
  // hasMeaningfulLayering,
} from "../../utils/layeringDisplay";
import { humanizeClothingSubtype } from "../../utils/clothingSubtype";
import { Anchor, ChevronDown, Settings2, PlaneIcon } from "lucide-react";

const MODE_ORDER: StylistMode[] = ["random", "complete", "improve", "selected"];

type AiStylistPanelProps = {
  status: "idle" | "loading" | "success" | "error";
  mode: StylistMode;
  onModeChange: (mode: StylistMode) => void;
  recommendations: OutfitRecommendation[];
  clothesById: Map<string, ClothingItem>;
  requiredItems: ClothingItem[];
  onRemoveRequiredItem?: (id: string) => void;
  /** Items locked into future generations */
  anchoredItems?: ClothingItem[];
  onUnanchorItem?: (id: string) => void;
  onAnchorAllPreview?: () => void;
  errorMessage?: string;
  errorCode?: string;
  credits?: number;
  clothesCount: number;
  feedbackSubmitted: Record<string, "positive" | "negative">;
  onGenerateClick: () => void;
  onTryAnother: () => void;
  onUseOutfit: (recommendation: OutfitRecommendation) => void;
  onSwapItem: (slot?: Slot) => void;
  onFeedback: (
    recommendation: OutfitRecommendation,
    rating: "positive" | "negative",
    reasons?: string[],
  ) => void;
  onBuyCredits?: () => void;
  appliedConfirmation?: string | null;
  refinementPrompt: string;
  onRefinementPromptChange: (value: string) => void;
  onRefine: () => void;
  generationLabel?: string | null;
  canGoPrev?: boolean;
  canGoNext?: boolean;
  onHistoryPrev?: () => void;
  onHistoryNext?: () => void;
  className?: string;
};

function RecommendationSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
      <div className="mb-2 h-4 w-24 rounded bg-indigo-200" />
      <div className="mb-2 h-5 w-40 rounded bg-indigo-200" />
      <div className="mb-3 h-3 w-full rounded bg-indigo-200" />
      <div className="mb-3 flex gap-3">
        <div className="h-16 w-16 rounded-xl bg-indigo-200" />
        <div className="h-16 w-16 rounded-xl bg-indigo-200" />
        <div className="h-16 w-16 rounded-xl bg-indigo-200" />
      </div>
      <div className="h-9 w-full rounded-xl bg-indigo-200" />
    </div>
  );
}

function modeEmptyMessage(mode: StylistMode): string | null {
  if (mode === "complete") {
    return "Add at least one item to your outfit preview first.";
  }
  if (mode === "improve") {
    return "Build an outfit first, then ask Almaari to improve it.";
  }
  if (mode === "selected") {
    return "Select one or more wardrobe items to style.";
  }
  return null;
}

export default function AiStylistPanel({
  status,
  mode,
  onModeChange,
  recommendations,
  clothesById,
  requiredItems,
  anchoredItems,
  onUnanchorItem,
  onAnchorAllPreview,
  errorMessage,
  errorCode,
  credits,
  clothesCount,
  feedbackSubmitted,
  onGenerateClick,
  onTryAnother,
  onUseOutfit,
  onSwapItem,
  onFeedback,
  onBuyCredits,
  appliedConfirmation,
  refinementPrompt,
  onRefinementPromptChange,
  onRefine,
  generationLabel,
  canGoPrev,
  canGoNext,
  onHistoryPrev,
  onHistoryNext,
  className = "",
}: AiStylistPanelProps) {
  const hasCredits = credits == null || credits >= 1;
  const [reasonPickerId, setReasonPickerId] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const modeMeta = STYLIST_MODE_META[mode];
  const emptyHint =
    mode !== "random" && requiredItems.length === 0
      ? modeEmptyMessage(mode)
      : null;
  const canGenerate =
    hasCredits && (mode === "random" || requiredItems.length > 0);
  const anchors = anchoredItems ?? [];
  const hasResults = status === "success" && recommendations.length > 0;

  // Collapse setup once outfits exist; reopen for idle / errors so the user can fix & retry.
  useEffect(() => {
    if (status === "success") {
      setSetupOpen(false);
    } else if (status === "error") {
      setSetupOpen(true);
    }
  }, [status]);

  const submitNegative = (recommendation: OutfitRecommendation) => {
    onFeedback(recommendation, "negative", selectedReasons);
    setReasonPickerId(null);
    setSelectedReasons([]);
  };

  if (clothesCount === 0) {
    return (
      <div
        id="ai-stylist"
        className={`rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-md backdrop-blur ${className}`}
      >
        <BuilderSectionHeader step="03" title="AI Stylist" />
        <p className="mt-4 text-sm text-indigo-800">
          Add clothes to your wardrobe before generating an outfit.
        </p>
      </div>
    );
  }

  return (
    <div
      id="ai-stylist"
      className={`flex min-h-0 flex-col rounded-2xl border border-indigo-200 bg-white/80 p-4 shadow-md backdrop-blur ${className}`}
    >
      <BuilderSectionHeader
        step="03"
        title="AI Stylist"
        action={
          <div className="flex items-center gap-1.5">
            {status === "success" ? (
              <button
                type="button"
                onClick={onTryAnother}
                disabled={!canGenerate}
                className="inline-flex min-h-9 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-100/70 px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-500 hover:text-white disabled:opacity-60"
              >
                Try Another
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setSetupOpen((open) => !open)}
              aria-expanded={setupOpen}
              aria-controls="ai-stylist-setup"
              className={`inline-flex min-h-9 items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                setupOpen
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-50"
              }`}
              title={setupOpen ? "Hide setup" : "Show setup"}
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Setup
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${
                  setupOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </button>
          </div>
        }
      />

      <nav
        id="ai-stylist-setup"
        aria-label="Stylist setup"
        className={`shrink-0 overflow-hidden transition-[max-height,opacity,margin] duration-300 ease-out ${
          setupOpen
            ? "mt-3 max-h-[40rem] opacity-100"
            : "pointer-events-none mt-0 max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3">
          <div
            role="tablist"
            aria-label="Stylist mode"
            className="mt-2.5 grid grid-cols-2 gap-1.5"
          >
            {MODE_ORDER.map((option) => {
              const active = option === mode;
              return (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onModeChange(option)}
                  className={`rounded-xl border px-2 py-2 text-left text-[11px] font-semibold leading-snug ${
                    active
                      ? "border-indigo-500 bg-indigo-600 text-white"
                      : "border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50"
                  }`}
                >
                  {STYLIST_MODE_META[option].label}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-indigo-700/80">
            {modeMeta.description}
          </p>

          <div className="mt-3 border-t border-indigo-100 pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                Anchored pieces
              </p>
              {onAnchorAllPreview && requiredItems.length > 0 ? (
                <button
                  type="button"
                  onClick={onAnchorAllPreview}
                  className="text-[11px] font-semibold text-indigo-700 underline-offset-2 hover:underline"
                >
                  Anchor all in preview
                </button>
              ) : null}
            </div>
            {anchors.length === 0 ? (
              <p className="mt-0.5 text-[11px] text-indigo-600/80">
                Tap the anchor icon on wardrobe cards (or use Anchor all) to
                lock pieces into the next generation.
              </p>
            ) : (
              <>
                <p className="mt-0.5 text-[11px] text-indigo-600/80">
                  These stay in every generated outfit until you unanchor them.
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {anchors.map((item) => (
                    <div
                      key={item._id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300 bg-indigo-50 py-1 pl-1 pr-2"
                      title="This item will stay in every generated outfit."
                    >
                      <div className="relative h-6 w-6 overflow-hidden rounded-full border border-indigo-200 bg-white">
                        <Image
                          src={item.imageSrc}
                          alt={humanizeClothingSubtype(item)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Anchor
                        className="h-3 w-3 shrink-0 text-indigo-700"
                        aria-hidden
                      />
                      <span className="max-w-[7rem] truncate text-[11px] font-medium text-indigo-900">
                        {humanizeClothingSubtype(item)}
                      </span>
                      {onUnanchorItem && (
                        <button
                          type="button"
                          aria-label={`Unanchor ${humanizeClothingSubtype(
                            item,
                          )}`}
                          onClick={() => onUnanchorItem(item._id)}
                          className="text-indigo-500 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {(status === "idle" || status === "error") && (
            <div className="mt-3 space-y-2 border-t border-indigo-100 pt-3">
              {status === "idle" && (
                <>
                  {emptyHint ? (
                    <p className="text-sm text-indigo-800">{emptyHint}</p>
                  ) : (
                    <p className="text-sm text-indigo-800">
                      Choose preferences in the next step, then Almaari will
                      build three complete looks.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={onGenerateClick}
                    disabled={!canGenerate}
                    className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    Generate 3 Outfits
                  </button>
                </>
              )}
              {status === "error" && (
                <>
                  <p className="text-sm font-medium text-red-700">
                    We couldn&apos;t generate outfits.
                  </p>
                  <p className="text-sm text-indigo-800">
                    {errorMessage ||
                      "Something went wrong while generating outfits."}
                  </p>
                  {(errorCode === "INSUFFICIENT_WARDROBE" ||
                    errorCode === "EMPTY_WARDROBE") && (
                    <p className="text-sm text-indigo-800">
                      Add a top, bottom, and shoes (or a dress and shoes) to
                      continue.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={onGenerateClick}
                    disabled={!canGenerate}
                    className="w-full rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-900 hover:bg-indigo-50 disabled:opacity-60"
                  >
                    Try Again
                  </button>
                </>
              )}
              {!hasCredits && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p>You need at least 1 credit to generate outfits.</p>
                  {onBuyCredits && (
                    <button
                      type="button"
                      onClick={onBuyCredits}
                      className="mt-2 text-indigo-700 underline"
                    >
                      Buy credits
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {!setupOpen && !hasResults && status !== "loading" ? (
        <button
          type="button"
          onClick={() => setSetupOpen(true)}
          className="mt-2 text-left text-[11px] font-medium text-indigo-600 underline-offset-2 hover:underline"
        >
          Open setup to choose a mode and generate
        </button>
      ) : null}

      {appliedConfirmation ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-800"
        >
          {appliedConfirmation}
        </p>
      ) : null}

      {generationLabel ? (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-indigo-800">
          <button
            type="button"
            onClick={onHistoryPrev}
            disabled={!canGoPrev}
            className="rounded-lg border border-indigo-200 px-2 py-1 disabled:opacity-40"
          >
            ‹ Previous
          </button>
          <span className="font-medium">{generationLabel}</span>
          <button
            type="button"
            onClick={onHistoryNext}
            disabled={!canGoNext}
            className="rounded-lg border border-indigo-200 px-2 py-1 disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      ) : null}

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {status === "loading" && (
          <div className="space-y-3" aria-live="polite">
            <div>
              <p className="text-sm font-medium text-indigo-900">
                {refinementPrompt
                  ? "Creating new versions from your feedback..."
                  : modeMeta.loading}
              </p>
              <p className="mt-1 text-xs text-indigo-700/75">
                Almaari is matching colors, categories, and your selected
                occasion.
              </p>
            </div>
            <RecommendationSkeleton />
            <RecommendationSkeleton />
            <RecommendationSkeleton />
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 pb-1">
            {Object.keys(feedbackSubmitted).length > 0 && (
              <p className="text-xs text-indigo-700/80">
                Thanks — we&apos;ll use this on your next generation.
              </p>
            )}
            {recommendations.map((recommendation) => {
              const items = recommendation.itemIds
                .map((id) => clothesById.get(id))
                .filter(Boolean) as ClothingItem[];
              const layerRows = buildLayerDisplayRows(
                recommendation.layering,
                clothesById,
              );
              const beltRow = buildBeltDisplayRow(
                recommendation.layering,
                clothesById,
                recommendation.itemIds,
              );
              // const showLayers = hasMeaningfulLayering(recommendation.layering);
              // const bottomItem = items.find((item) => item.slot === "legs");
              const displayItems = items.filter(
                (item) => !beltRow || item._id !== beltRow.itemId,
              );

              return (
                <article
                  key={recommendation.id}
                  className="min-w-0 overflow-hidden rounded-xl border border-indigo-100 bg-indigo-50/40 p-4"
                >
                  {/* <span className="inline-flex rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                    {recommendation.label}
                  </span> */}
                  <h4 className="mt-2 break-words text-base font-semibold text-indigo-900">
                    {recommendation.name}
                    <PlaneIcon className="h-4 w-4" aria-hidden />
                  </h4>
                  {/* <p className="mt-1 line-clamp-2 text-sm text-indigo-800/90">
                    {recommendation.explanation}
                  </p> */}

                  {/* {showLayers && layerRows.length > 0 && (
                    <div className="mt-3 min-w-0 rounded-lg border border-indigo-100 bg-white/80 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                        Layered upper body
                      </p>
                      <ul className="mt-1.5">
                        {layerRows.map((row) => (
                          <li
                            key={row.itemId}
                            className="flex min-w-0 gap-1.5 text-xs leading-snug text-indigo-900"
                          >
                            <span className="shrink-0 font-medium text-indigo-600">
                              {row.roleLabel}:
                            </span>
                            <span className="min-w-0 break-words">
                              {row.displayName}
                              {row.wearLabel ? (
                                <span className="text-indigo-500">
                                  {" "}
                                  — {row.wearLabel}
                                </span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )} */}

                  {/* {(bottomItem || beltRow) && (
                    <div className="mt-2 min-w-0 rounded-lg border border-indigo-100 bg-white/80 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                        Bottom & waist
                      </p>
                      <ul className="mt-1.5">
                        {bottomItem ? (
                          <li className="flex min-w-0 gap-1.5 text-xs leading-snug text-indigo-900">
                            <span className="shrink-0 font-medium text-indigo-600">
                              Bottom:
                            </span>
                            <span className="min-w-0 break-words">
                              {bottomItem.type}
                            </span>
                          </li>
                        ) : null}
                        {beltRow ? (
                          <li className="flex min-w-0 gap-1.5 text-xs leading-snug text-indigo-900">
                            <span className="shrink-0 font-medium text-indigo-600">
                              Belt:
                            </span>
                            <span className="min-w-0 break-words">
                              {beltRow.displayName}
                            </span>
                          </li>
                        ) : null}
                      </ul>
                    </div>
                  )} */}

                  <div className="mt-3 flex flex-wrap gap-3">
                    {displayItems.map((item) => {
                      const layerRow = layerRows.find(
                        (row) => row.itemId === item._id,
                      );
                      const caption =
                        layerRow?.roleLabel ||
                        (item.slot === "legs" ? "Bottom" : null) ||
                        SLOT_LABELS[item.slot] ||
                        item.slot;
                      return (
                        <div key={item._id} className="w-[72px] text-center">
                          <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-xl border border-indigo-200 bg-white">
                            <Image
                              src={item.imageSrc}
                              alt={item.type}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <p className="mt-1.5 text-[11px] font-medium text-indigo-700">
                            {caption}
                          </p>
                          {layerRow?.wearLabel ? (
                            <p className="text-[10px] text-indigo-500">
                              {layerRow.wearLabel}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                    {beltRow?.item ? (
                      <div className="w-[72px] text-center">
                        <div className="relative mx-auto h-16 w-16 overflow-hidden rounded-xl border border-indigo-200 bg-white">
                          <Image
                            src={beltRow.item.imageSrc}
                            alt={beltRow.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] font-medium text-indigo-700">
                          Belt
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {reasonPickerId === recommendation.id &&
                    feedbackSubmitted[recommendation.id] !== "negative" && (
                      <div className="mt-3 rounded-lg border border-indigo-100 bg-white p-2">
                        <p className="mb-2 text-xs text-indigo-700">
                          Optional — why didn&apos;t this work?
                        </p>
                        <div className="mb-2 flex flex-wrap gap-1">
                          {stylistNegativeReasons_List.map((reason) => {
                            const selected = selectedReasons.includes(reason);
                            return (
                              <button
                                key={reason}
                                type="button"
                                onClick={() =>
                                  setSelectedReasons((prev) =>
                                    selected
                                      ? prev.filter((item) => item !== reason)
                                      : [...prev, reason],
                                  )
                                }
                                className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                  selected
                                    ? "border-indigo-500 bg-indigo-600 text-white"
                                    : "border-indigo-200 text-indigo-800"
                                }`}
                              >
                                {reason}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => submitNegative(recommendation)}
                            className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] text-white"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReasonPickerId(null);
                              setSelectedReasons([]);
                            }}
                            className="rounded-md border border-indigo-200 px-2 py-1 text-[11px] text-indigo-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      onClick={() => onUseOutfit(recommendation)}
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 sm:flex-none"
                    >
                      Use Outfit
                    </button>
                    <button
                      type="button"
                      onClick={() => onSwapItem()}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-100"
                    >
                      Swap Item
                    </button>
                    <div className="ml-auto flex gap-1">
                      <button
                        type="button"
                        aria-label="Helpful"
                        onClick={() => onFeedback(recommendation, "positive")}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                          feedbackSubmitted[recommendation.id] === "positive"
                            ? "border-green-400 bg-green-50"
                            : "border-indigo-200 bg-white text-indigo-700"
                        }`}
                      >
                        Helpful
                      </button>
                      <button
                        type="button"
                        aria-label="Not helpful"
                        onClick={() => {
                          setReasonPickerId(recommendation.id);
                          setSelectedReasons([]);
                        }}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                          feedbackSubmitted[recommendation.id] === "negative"
                            ? "border-red-300 bg-red-50"
                            : "border-indigo-200 bg-white text-indigo-700"
                        }`}
                      >
                        Not helpful
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            <div className="rounded-xl border border-indigo-200 bg-white p-3">
              {anchors.length > 0 ? (
                <div className="mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                    Anchored for the next generation
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {anchors.map((item) => (
                      <span
                        key={`refine-anchor-${item._id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-900"
                      >
                        <Anchor className="h-3 w-3" aria-hidden />
                        {humanizeClothingSubtype(item)}
                        {onUnanchorItem ? (
                          <button
                            type="button"
                            aria-label={`Unanchor ${humanizeClothingSubtype(
                              item,
                            )}`}
                            onClick={() => onUnanchorItem(item._id)}
                            className="ml-0.5 text-indigo-500 hover:text-indigo-800"
                          >
                            ×
                          </button>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <p className="text-xs font-semibold text-indigo-800">
                Refine these outfits
              </p>
              <textarea
                value={refinementPrompt}
                onChange={(e) => onRefinementPromptChange(e.target.value)}
                rows={2}
                placeholder="Make these more casual, warmer, simpler, bolder, or better for dinner..."
                className="mt-2 w-full rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 py-2 text-sm text-indigo-900 placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <button
                type="button"
                onClick={onRefine}
                disabled={!canGenerate || !refinementPrompt.trim()}
                className="mt-2 w-full rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Generate New Versions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
