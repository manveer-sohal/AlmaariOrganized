"use client";

import React, { RefObject, useCallback, useEffect, useMemo, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQueryClient } from "@tanstack/react-query";
import { ClothingItem, Slot } from "../../types/clothes";
import {
  DEFAULT_STYLIST_PREFERENCES,
  OutfitRecommendation,
  StylistPreferences,
} from "../../types/aiStylist";
import UsersClothes from "./UsersClothes";
import BuilderOutfitPreview from "./BuilderOutfitPreview";
import AiStylistPanel from "./AiStylist";
import StylistConfigModal from "./StylistConfigModal";
import OutfitBuilderHeader from "./OutfitBuilderHeader";
import BuilderMobileTabs, { BuilderTab } from "./BuilderMobileTabs";
import MobileSaveBar from "./MobileSaveBar";
import { useClothesData } from "../../hooks/useClothesData";
import { useCredits } from "../../hooks/useCredits";
import { useStylistRecommendations } from "../../hooks/useStylistRecommendations";
import { useStylistFeedback } from "../../hooks/useStylistFeedback";
import { useInView } from "react-intersection-observer";
import {
  clearAuthTokenCache,
  getAuthHeaders,
} from "../../utils/getAuthHeaders";

type StylistUiStatus = "idle" | "loading" | "success" | "error";

type CreateOutfitUIProps = {
  onBuyCredits?: () => void;
  onAddClothes?: () => void;
};

const emptySlots = (): Partial<Record<Slot, ClothingItem[] | null>> => ({
  head: null,
  body: null,
  legs: null,
  feet: null,
});

const applyRecommendationToSlots = (
  recommendation: OutfitRecommendation,
  clothesById: Map<string, ClothingItem>,
) => {
  const next = emptySlots();
  recommendation.itemIds.forEach((id) => {
    const item = clothesById.get(id);
    if (!item) return;
    next[item.slot as Slot] = [item];
  });
  return next;
};

function CreateOutfitUI({ onBuyCredits, onAddClothes }: CreateOutfitUIProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { credits } = useCredits();
  const numberOfClothes = 20;

  const [selectedBySlot, setSelectedBySlot] =
    useState<Partial<Record<Slot, ClothingItem[] | null>>>(emptySlots());
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<Slot | "all">("all");
  const [lastSelectedItemId, setLastSelectedItemId] = useState<string | null>(
    null,
  );
  const [preferences, setPreferences] = useState<StylistPreferences>(
    DEFAULT_STYLIST_PREFERENCES,
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [configMode, setConfigMode] = useState<"generate" | "style-item">(
    "generate",
  );
  const [anchorItemId, setAnchorItemId] = useState<string | undefined>();
  const [stylistStatus, setStylistStatus] = useState<StylistUiStatus>("idle");
  const [recommendations, setRecommendations] = useState<OutfitRecommendation[]>(
    [],
  );
  const [stylistError, setStylistError] = useState<string>("");
  const [stylistErrorCode, setStylistErrorCode] = useState<string | undefined>();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<
    Record<string, "positive" | "negative">
  >({});
  const [swapMode, setSwapMode] = useState(false);
  const [swapTargetSlot, setSwapTargetSlot] = useState<Slot | null>(null);
  const [mobileTab, setMobileTab] = useState<BuilderTab>("clothes");
  const [previewHighlight, setPreviewHighlight] = useState(false);
  const [appliedConfirmation, setAppliedConfirmation] = useState<string | null>(
    null,
  );

  const {
    clothes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoadingClothes,
    error,
  } = useClothesData(numberOfClothes);

  const {
    mutateAsync: generateRecommendations,
    isPending: isGenerating,
  } = useStylistRecommendations();
  const { mutate: submitFeedback } = useStylistFeedback();

  const { ref, inView } = useInView();
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!appliedConfirmation) return;
    const timer = window.setTimeout(() => setAppliedConfirmation(null), 2800);
    return () => window.clearTimeout(timer);
  }, [appliedConfirmation]);

  useEffect(() => {
    if (!previewHighlight) return;
    const timer = window.setTimeout(() => setPreviewHighlight(false), 1600);
    return () => window.clearTimeout(timer);
  }, [previewHighlight]);

  const selectedItems = useMemo(() => {
    return Object.values(selectedBySlot).filter(
      (v): v is ClothingItem[] => Array.isArray(v) && v.length > 0,
    );
  }, [selectedBySlot]);

  const filledSlotCount = useMemo(() => {
    return (["body", "legs", "feet", "head"] as Slot[]).filter((slot) => {
      const items = selectedBySlot[slot];
      return Array.isArray(items) && items.length > 0;
    }).length;
  }, [selectedBySlot]);

  const clothesById = useMemo(
    () => new Map(clothes?.map((c: ClothingItem) => [c._id, c])),
    [clothes],
  );

  const anchorItem = anchorItemId ? clothesById.get(anchorItemId) : undefined;

  const enterSwapMode = useCallback((slot?: Slot) => {
    setSwapMode(true);
    setSwapTargetSlot(slot ?? null);
    if (slot) {
      setCategoryFilter(slot);
    }
    setMobileTab("clothes");
  }, []);

  const exitSwapMode = useCallback(() => {
    setSwapMode(false);
    setSwapTargetSlot(null);
  }, []);

  const toggleSelect = useCallback(
    (id: string) => {
      const item = clothesById.get(id) as ClothingItem | undefined;
      if (!item) return;

      setLastSelectedItemId(id);

      if (swapMode) {
        if (swapTargetSlot && item.slot !== swapTargetSlot) {
          return;
        }
        setSelectedBySlot((prev) => {
          const next = { ...prev };
          const slot = item.slot as Slot;
          next[slot] = [item];
          return next;
        });
        exitSwapMode();
        setMobileTab("preview");
        return;
      }

      setSelectedBySlot((prev) => {
        const current = prev[item.slot as Slot];
        if (current && current.length > 0 && current.some((c) => c._id === id)) {
          return {
            ...prev,
            [item.slot]: current.filter((c) => c._id !== id),
          };
        }
        return { ...prev, [item.slot]: [...(current || []), item] };
      });
    },
    [clothesById, swapMode, swapTargetSlot, exitSwapMode],
  );

  const openGenerateModal = (mode: "generate" | "style-item") => {
    if (credits != null && credits < 1) {
      onBuyCredits?.();
      return;
    }
    setConfigMode(mode);
    if (mode === "style-item") {
      setAnchorItemId((prev) => lastSelectedItemId || prev);
    } else {
      setAnchorItemId(undefined);
    }
    setConfigOpen(true);
    setMobileTab("ai");
  };

  const runGeneration = async () => {
    if (credits != null && credits < 1) {
      onBuyCredits?.();
      return;
    }

    setConfigOpen(false);
    setStylistStatus("loading");
    setStylistError("");
    setStylistErrorCode(undefined);
    setMobileTab("ai");

    try {
      const result = await generateRecommendations({
        ...preferences,
        anchorItemId: configMode === "style-item" ? anchorItemId : undefined,
      });

      setRecommendations(result.data.recommendations);
      setStylistStatus("success");
      setFeedbackSubmitted({});
    } catch (generationError) {
      if (
        generationError instanceof Error &&
        generationError.message === "STALE_REQUEST"
      ) {
        return;
      }

      const err = generationError as Error & {
        code?: string;
        status?: number;
      };
      setStylistStatus("error");
      setStylistError(err.message || "Failed to generate outfits");
      setStylistErrorCode(err.code);
    }
  };

  const handleUseOutfit = (recommendation: OutfitRecommendation) => {
    setSelectedBySlot(applyRecommendationToSlots(recommendation, clothesById));
    exitSwapMode();
    setPreviewHighlight(true);
    setAppliedConfirmation("Outfit added to preview");
    setMobileTab("preview");
  };

  const handleFeedback = (
    recommendation: OutfitRecommendation,
    rating: "positive" | "negative",
    reasons?: string[],
  ) => {
    setFeedbackSubmitted((prev) => ({ ...prev, [recommendation.id]: rating }));
    submitFeedback({
      recommendationId: recommendation.id,
      outfitItemIds: recommendation.itemIds,
      outfitSignature: [...recommendation.itemIds].map(String).sort().join("|"),
      label: recommendation.label,
      rating,
      reasons: rating === "negative" ? reasons : undefined,
      occasion: preferences.occasion,
      style: preferences.style,
    });
  };

  const saveOutfit = async () => {
    if (!user || selectedItems.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        name,
        colour: JSON.stringify([]),
        season: JSON.stringify([]),
        waterproof: false,
        outfit_items: selectedItems.map((i) => ({
          _id: i.map((c) => c._id),
        })),
      };

      const createOutfit = async () =>
        fetch(`/api/clothes/createOutfit`, {
          method: "POST",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });

      let response = await createOutfit();
      if (response.status === 401) {
        clearAuthTokenCache();
        response = await createOutfit();
      }
      if (!response.ok) throw new Error("Failed to save outfit");
      setSelectedBySlot(emptySlots());
      setName("");
      setAppliedConfirmation(null);
      queryClient.invalidateQueries({ queryKey: ["user", user?.sub] });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedItems.length > 0;
  const panelHeightClass =
    "md:h-[calc(100vh-220px)] md:max-h-[calc(100vh-220px)] xl:h-[min(760px,calc(100vh-220px))]";

  return (
    <div className="z-10 w-full p-4 pb-28 md:rounded-tl-3xl md:pb-8">
      <StylistConfigModal
        open={configOpen}
        mode={configMode}
        anchorItemName={anchorItem?.type}
        preferences={preferences}
        onChange={setPreferences}
        onClose={() => setConfigOpen(false)}
        onSubmit={runGeneration}
        isSubmitting={isGenerating}
        credits={credits}
      />

      <div className="mx-auto w-full max-w-[1400px]">
        <OutfitBuilderHeader
          name={name}
          onNameChange={setName}
          selectedCount={filledSlotCount}
          saving={saving}
          canSave={canSave}
          onSave={saveOutfit}
          hideSaveOnMobile
        />

        <BuilderMobileTabs activeTab={mobileTab} onChange={setMobileTab} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(340px,1.1fr)_minmax(280px,0.72fr)_minmax(360px,1fr)] xl:items-start">
          <section
            id="builder-panel-clothes"
            role="tabpanel"
            aria-labelledby="builder-tab-clothes"
            className={`min-h-0 ${
              mobileTab === "clothes" ? "block" : "hidden"
            } md:block ${panelHeightClass}`}
          >
            <UsersClothes
              isLoadingClothes={isLoadingClothes}
              error={error}
              clothes={clothes}
              selectedItems={selectedItems}
              toggleSelect={toggleSelect}
              ref={(ref as unknown) as RefObject<HTMLDivElement>}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              lastSelectedItemId={lastSelectedItemId}
              onStyleThisItem={() => openGenerateModal("style-item")}
              swapMode={swapMode}
              swapTargetSlot={swapTargetSlot}
              onCancelSwap={exitSwapMode}
              onAddClothes={onAddClothes}
              className="h-full"
            />
          </section>

          <section
            id="builder-panel-preview"
            role="tabpanel"
            aria-labelledby="builder-tab-preview"
            className={`min-h-0 ${
              mobileTab === "preview" ? "block" : "hidden"
            } md:block xl:sticky xl:top-4 ${panelHeightClass}`}
          >
            <div className="mb-3 md:hidden">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-indigo-800">
                  Outfit name (optional)
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Outfit name (optional)"
                  className="h-10 w-full rounded-xl border border-indigo-300 bg-white px-3 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </label>
            </div>
            <BuilderOutfitPreview
              selectedBySlot={selectedBySlot}
              setSelectedBySlot={setSelectedBySlot}
              swapMode={swapMode}
              swapTargetSlot={swapTargetSlot}
              onReplaceSlot={enterSwapMode}
              highlightApplied={previewHighlight}
              className="h-full min-h-[420px] md:min-h-0"
            />
          </section>

          <section
            id="builder-panel-ai"
            role="tabpanel"
            aria-labelledby="builder-tab-ai"
            className={`min-h-0 md:col-span-2 xl:col-span-1 ${
              mobileTab === "ai" ? "block" : "hidden"
            } md:block ${panelHeightClass}`}
          >
            <AiStylistPanel
              status={isGenerating ? "loading" : stylistStatus}
              recommendations={recommendations}
              clothesById={clothesById}
              errorMessage={stylistError}
              errorCode={stylistErrorCode}
              credits={credits}
              clothesCount={clothes.length}
              feedbackSubmitted={feedbackSubmitted}
              onGenerateClick={() =>
                openGenerateModal(anchorItemId ? "style-item" : "generate")
              }
              onTryAnother={() => openGenerateModal("generate")}
              onUseOutfit={handleUseOutfit}
              onSwapItem={enterSwapMode}
              onFeedback={handleFeedback}
              onBuyCredits={onBuyCredits}
              anchorItem={anchorItem ?? null}
              appliedConfirmation={appliedConfirmation}
              className="h-full"
            />
          </section>
        </div>
      </div>

      {mobileTab === "preview" ? (
        <MobileSaveBar
          selectedCount={filledSlotCount}
          saving={saving}
          canSave={canSave}
          onSave={saveOutfit}
        />
      ) : null}
    </div>
  );
}

export default CreateOutfitUI;
