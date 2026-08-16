"use client";

import React, {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQueryClient } from "@tanstack/react-query";
import { ClothingItem, Outfit, Slot } from "../../types/clothes";
import {
  DEFAULT_STYLIST_PREFERENCES,
  OutfitRecommendation,
  StylistMode,
  StylistOccasion,
  StylistPreferences,
} from "../../types/aiStylist";
import UsersClothes from "./UsersClothes";
import AIStylistSidebar from "./AIStylistSidebar";
import DesktopOutfitBuilderShell from "./DesktopOutfitBuilderShell";
import OutfitBuilderHeader from "./OutfitBuilderHeader";
import MobileOutfitBuilderShell from "./MobileOutfitBuilderShell";
import AIStylistBottomSheet from "./AIStylistBottomSheet";
import WardrobeDrawer from "./WardrobeDrawer";
import MobileGenerationHistorySheet from "./MobileGenerationHistorySheet";
import StylistEntryPrompt from "../../components/ux/StylistEntryPrompt";
import { useClothesData, WARDROBE_IN_VIEW_OPTIONS, WARDROBE_PAGE_SIZE } from "../../hooks/useClothesData";
import { useCredits } from "../../hooks/useCredits";
import { useStylistRecommendations } from "../../hooks/useStylistRecommendations";
import { useStylistFeedback } from "../../hooks/useStylistFeedback";
import { useStylistSession } from "../../hooks/useStylistSession";
import { useInView } from "react-intersection-observer";
import {
  clearAuthTokenCache,
  getAuthHeaders,
} from "../../utils/getAuthHeaders";

type StylistUiStatus = "idle" | "loading" | "success" | "error";

type CreateOutfitUIProps = {
  onBuyCredits?: () => void;
  onAddClothes?: () => void;
  seedItem?: ClothingItem | null;
  /** Prefill the builder from an existing outfit and open Improve mode. */
  seedOutfit?: Outfit | null;
  onSeedConsumed?: () => void;
};

const emptySlots = (): Partial<Record<Slot, ClothingItem[] | null>> => ({
  head: null,
  body: null,
  legs: null,
  feet: null,
});

const outfitToSlots = (
  outfit: Outfit,
): Partial<Record<Slot, ClothingItem[] | null>> => {
  const next = emptySlots();
  for (const item of outfit.outfit_items) {
    const slot = item.slot as Slot;
    const existing = next[slot] || [];
    if (existing.some((c) => c._id === item._id)) continue;
    next[slot] = [...existing, item];
  }
  return next;
};

const applyRecommendationToSlots = (
  recommendation: OutfitRecommendation,
  clothesById: Map<string, ClothingItem>,
) => {
  const next = emptySlots();
  const layering = recommendation.layering;
  const placed = new Set<string>();

  const append = (item: ClothingItem) => {
    const slot = item.slot as Slot;
    const existing = next[slot] || [];
    if (existing.some((c) => c._id === item._id)) return;
    next[slot] = [...existing, item];
    placed.add(item._id);
  };

  if (layering) {
    for (const id of [
      layering.baseTopId,
      layering.midLayerId,
      layering.outerLayerId,
      layering.neckwearId,
    ]) {
      if (!id) continue;
      const item = clothesById.get(id);
      if (item) append(item);
    }
  }

  recommendation.itemIds.forEach((id) => {
    if (placed.has(id)) return;
    const item = clothesById.get(id);
    if (!item) return;
    append(item);
  });

  return next;
};

function CreateOutfitUI({
  onBuyCredits,
  onAddClothes,
  seedItem,
  seedOutfit,
  onSeedConsumed,
}: CreateOutfitUIProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { credits } = useCredits();
  const numberOfClothes = WARDROBE_PAGE_SIZE;

  const [selectedBySlot, setSelectedBySlot] = useState<
    Partial<Record<Slot, ClothingItem[] | null>>
  >(emptySlots());
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<Slot | "all">("all");
  const [lastSelectedItemId, setLastSelectedItemId] = useState<string | null>(
    null,
  );
  const [preferences, setPreferences] = useState<StylistPreferences>(
    DEFAULT_STYLIST_PREFERENCES,
  );
  const [stylistMode, setStylistMode] = useState<StylistMode>("random");
  const [refinementPrompt, setRefinementPrompt] = useState("");
  const [pendingRefinement, setPendingRefinement] = useState<string | null>(
    null,
  );
  const [anchoredItemIds, setAnchoredItemIds] = useState<string[]>([]);
  const [stylistStatus, setStylistStatus] = useState<StylistUiStatus>("idle");
  const [stylistError, setStylistError] = useState<string>("");
  const [stylistErrorCode, setStylistErrorCode] = useState<
    string | undefined
  >();
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<
    Record<string, "positive" | "negative">
  >({});
  const [swapMode, setSwapMode] = useState(false);
  const [swapTargetSlot, setSwapTargetSlot] = useState<Slot | null>(null);
  const [previewHighlight, setPreviewHighlight] = useState(false);
  const [appliedConfirmation, setAppliedConfirmation] = useState<string | null>(
    null,
  );
  const [isAIStylistOpen, setIsAIStylistOpen] = useState(false);
  const [isWardrobeDrawerOpen, setIsWardrobeDrawerOpen] = useState(false);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [activeGeneratedIndex, setActiveGeneratedIndex] = useState(0);
  const [carouselReturnNonce, setCarouselReturnNonce] = useState(0);
  const [flashCarouselNext, setFlashCarouselNext] = useState(false);
  const [showEntryPrompt, setShowEntryPrompt] = useState(false);

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
  const session = useStylistSession();

  const { ref, inView } = useInView(WARDROBE_IN_VIEW_OPTIONS);
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

  useEffect(() => {
    setActiveGeneratedIndex(0);
  }, [session.activeGeneration?.id]);

  useEffect(() => {
    if (!flashCarouselNext) return;
    if (activeGeneratedIndex > 0) {
      setFlashCarouselNext(false);
      return;
    }
    const timer = window.setTimeout(() => setFlashCarouselNext(false), 8000);
    return () => window.clearTimeout(timer);
  }, [flashCarouselNext, activeGeneratedIndex]);

  useEffect(() => {
    if (!seedItem) return;
    setShowEntryPrompt(false);
    setStylistMode("selected");
    setAnchoredItemIds([seedItem._id]);
    setSelectedBySlot((prev) => {
      const slot = seedItem.slot as Slot;
      const existing = prev[slot] || [];
      if (existing.some((c) => c._id === seedItem._id)) return prev;
      return { ...prev, [slot]: [...existing, seedItem] };
    });
    setIsAIStylistOpen(true);
    onSeedConsumed?.();
  }, [seedItem, onSeedConsumed]);

  useEffect(() => {
    if (!seedOutfit) return;
    setShowEntryPrompt(false);
    setStylistMode("improve");
    setName(seedOutfit.name || "");
    setSelectedBySlot(outfitToSlots(seedOutfit));
    setAnchoredItemIds([]);
    setActiveGeneratedIndex(0);
    setIsAIStylistOpen(true);
    onSeedConsumed?.();
  }, [seedOutfit, onSeedConsumed]);

  const handleOccasionSelect = (occasion: StylistOccasion) => {
    setPreferences((prev) => ({ ...prev, occasion }));
    setShowEntryPrompt(false);
    setIsAIStylistOpen(true);
  };

  const selectedItems = useMemo(() => {
    return Object.values(selectedBySlot).filter(
      (v): v is ClothingItem[] => Array.isArray(v) && v.length > 0,
    );
  }, [selectedBySlot]);

  const previewItems = useMemo(() => selectedItems.flat(), [selectedItems]);

  const previewItemIds = useMemo(() => previewItems.map((item) => item._id), [
    previewItems,
  ]);

  const requiredItemsForMode = useMemo(() => {
    if (stylistMode === "random") return [];
    return previewItems;
  }, [stylistMode, previewItems]);

  const clothesById = useMemo(
    () => new Map(clothes?.map((c: ClothingItem) => [c._id, c])),
    [clothes],
  );

  const anchoredItems = useMemo(
    () =>
      anchoredItemIds
        .map((id) => clothesById.get(id))
        .filter(Boolean) as ClothingItem[],
    [anchoredItemIds, clothesById],
  );

  const filledSlotCount = useMemo(() => {
    return (["body", "legs", "feet", "head"] as Slot[]).filter((slot) => {
      const items = selectedBySlot[slot];
      return Array.isArray(items) && items.length > 0;
    }).length;
  }, [selectedBySlot]);

  const exitSwapMode = useCallback(() => {
    setSwapMode(false);
    setSwapTargetSlot(null);
  }, []);

  const enterSwapMode = useCallback((slot?: Slot) => {
    setSwapMode(true);
    setSwapTargetSlot(slot ?? null);
    if (slot) {
      setCategoryFilter(slot);
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches
    ) {
      setIsWardrobeDrawerOpen(true);
    }
  }, []);

  const unanchorItem = useCallback((id: string) => {
    setAnchoredItemIds((prev) => prev.filter((itemId) => itemId !== id));
  }, []);

  const ensureItemInPreview = useCallback((item: ClothingItem) => {
    setSelectedBySlot((prev) => {
      const slot = item.slot as Slot;
      const current = prev[slot] || [];
      if (current.some((c) => c._id === item._id)) return prev;
      return { ...prev, [slot]: [...current, item] };
    });
  }, []);

  const removeItemFromPreview = useCallback(
    (id: string) => {
      const item = clothesById.get(id);
      if (!item) {
        setAnchoredItemIds((prev) => prev.filter((itemId) => itemId !== id));
        return;
      }
      setSelectedBySlot((prev) => {
        const slot = item.slot as Slot;
        const next = (prev[slot] || []).filter((c) => c._id !== id);
        return { ...prev, [slot]: next.length > 0 ? next : null };
      });
      setAnchoredItemIds((prev) => prev.filter((itemId) => itemId !== id));
    },
    [clothesById],
  );

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
        setIsWardrobeDrawerOpen(false);
        return;
      }

      const slot = item.slot as Slot;
      const current = selectedBySlot[slot] || [];
      const isRemoving = current.some((c) => c._id === id);

      if (isRemoving) {
        const next = current.filter((c) => c._id !== id);
        setSelectedBySlot((prev) => ({
          ...prev,
          [slot]: next.length > 0 ? next : null,
        }));
        setAnchoredItemIds((anchors) =>
          anchors.filter((itemId) => itemId !== id),
        );
      } else {
        setSelectedBySlot((prev) => ({
          ...prev,
          [slot]: [...(prev[slot] || []), item],
        }));
      }
    },
    [clothesById, swapMode, swapTargetSlot, exitSwapMode, selectedBySlot],
  );

  const toggleAnchorItem = useCallback(
    (id: string) => {
      const item = clothesById.get(id);
      if (!item) return;

      const willAnchor = !anchoredItemIds.includes(id);
      if (willAnchor) {
        ensureItemInPreview(item);
        setAnchoredItemIds((prev) =>
          prev.includes(id) ? prev : [...prev, id],
        );
      } else {
        setAnchoredItemIds((prev) => prev.filter((itemId) => itemId !== id));
      }
    },
    [clothesById, ensureItemInPreview, anchoredItemIds],
  );

  const anchorAllPreviewItems = useCallback(() => {
    const ids = previewItems.map((item) => item._id);
    if (ids.length === 0) return;
    const allAnchored = ids.every((id) => anchoredItemIds.includes(id));
    if (allAnchored) {
      setAnchoredItemIds((prev) => prev.filter((id) => !ids.includes(id)));
      return;
    }
    setAnchoredItemIds((prev) => [...new Set([...prev, ...ids])]);
  }, [previewItems, anchoredItemIds]);

  const openAISheet = () => {
    if (credits != null && credits < 1) {
      onBuyCredits?.();
      return;
    }
    setPendingRefinement(null);
    setIsAIStylistOpen(true);
  };

  const runGeneration = async (options?: {
    refinement?: string | null;
    parentGenerationId?: string | null;
  }) => {
    if (credits != null && credits < 1) {
      onBuyCredits?.();
      return;
    }

    if (
      stylistMode !== "random" &&
      requiredItemsForMode.length === 0 &&
      anchoredItemIds.length === 0
    ) {
      setStylistStatus("error");
      setStylistErrorCode(
        stylistMode === "selected" ? "EMPTY_SELECTION" : "EMPTY_PREVIEW",
      );
      setStylistError(
        stylistMode === "selected"
          ? "Select one or more wardrobe items to style."
          : stylistMode === "improve"
          ? "Build an outfit first, then ask Almaari to improve it."
          : "Add at least one item to your outfit preview first.",
      );
      setIsAIStylistOpen(true);
      return;
    }

    const refinement =
      options?.refinement?.trim() || pendingRefinement?.trim() || "";

    setStylistStatus("loading");
    setStylistError("");
    setStylistErrorCode(undefined);

    const seedIds = requiredItemsForMode.map((item) => item._id);
    const requiredItemIds =
      stylistMode === "random"
        ? []
        : [...new Set([...anchoredItemIds, ...seedIds])];

    try {
      const result = await generateRecommendations({
        ...preferences,
        mode: stylistMode,
        requiredItemIds:
          stylistMode === "selected" ? requiredItemIds : undefined,
        previewItemIds:
          stylistMode === "complete" || stylistMode === "improve"
            ? requiredItemIds
            : previewItemIds,
        refinementPrompt: refinement || undefined,
        parentGenerationId: options?.parentGenerationId ?? null,
        priorOutfitSignatures: session.priorOutfitSignatures,
      });

      const generationId = result.data.generationId || crypto.randomUUID();
      const mode = result.data.mode || stylistMode;
      const resolvedRequired = result.data.requiredItemIds || requiredItemIds;

      const snapshotAnchors = mode === "random" ? [] : [...resolvedRequired];
      if (snapshotAnchors.length > 0) {
        setAnchoredItemIds(snapshotAnchors);
      }

      session.appendGeneration({
        id: generationId,
        parentGenerationId: options?.parentGenerationId ?? null,
        mode,
        prompt: refinement || null,
        requiredItemIds: resolvedRequired,
        anchoredItemIds: snapshotAnchors,
        inputs: {
          occasion: preferences.occasion,
          weather: preferences.weather,
          stylePreference: preferences.style,
          avoid: preferences.avoid,
          refinementPrompt: refinement || null,
        },
        outfits: result.data.recommendations,
      });

      setStylistStatus("success");
      setRefinementPrompt("");
      setPendingRefinement(null);
      setFlashCarouselNext(true);
      setIsAIStylistOpen(false);
      const count = result.data.recommendations?.length || 3;
      setAppliedConfirmation(`${count} outfits generated — browse to compare`);
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
      setIsAIStylistOpen(true);
    }
  };

  const handleUseOutfit = (recommendation: OutfitRecommendation) => {
    setSelectedBySlot(applyRecommendationToSlots(recommendation, clothesById));
    exitSwapMode();
    setPreviewHighlight(true);
    setActiveGeneratedIndex(0);
    setCarouselReturnNonce((n) => n + 1);
    setAppliedConfirmation("Outfit applied to your look");
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
      outfitSignature: [...recommendation.itemIds]
        .map(String)
        .sort()
        .join("|"),
      label: recommendation.label,
      rating,
      reasons: rating === "negative" ? reasons : undefined,
      occasion: preferences.occasion,
      style: preferences.style,
      generationId: session.activeGeneration?.id,
      mode: session.activeGeneration?.mode || stylistMode,
    });
  };

  const handleRefine = () => {
    if (!refinementPrompt.trim()) return;
    if (credits != null && credits < 1) {
      onBuyCredits?.();
      return;
    }
    void runGeneration({
      refinement: refinementPrompt,
      parentGenerationId: session.activeGeneration?.id ?? null,
    });
  };

  const handleModeChange = (mode: StylistMode) => {
    setStylistMode(mode);
    if (stylistStatus === "error") {
      setStylistStatus(session.hasHistory ? "success" : "idle");
      setStylistError("");
      setStylistErrorCode(undefined);
    }
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
      queryClient.invalidateQueries({ queryKey: ["outfits", user?.sub] });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const canSave = selectedItems.length > 0;
  const panelHeightClass =
    "md:h-[calc(100vh-220px)] md:max-h-[calc(100vh-220px)] xl:h-[min(760px,calc(100vh-220px))]";

  const displayStatus = isGenerating
    ? "loading"
    : stylistStatus === "idle" && session.hasHistory
    ? "success"
    : stylistStatus;

  const canGenerate =
    (credits == null || credits >= 1) &&
    (stylistMode === "random" ||
      requiredItemsForMode.length > 0 ||
      anchoredItemIds.length > 0);

  const infiniteScrollRef = (ref as unknown) as RefObject<HTMLDivElement>;

  return (
    <div className="z-10 flex h-full min-h-0 w-full flex-col overflow-hidden bg-almaari-bg p-3 pb-nav md:h-auto md:min-h-full md:overflow-y-auto md:overflow-visible md:p-4 md:pb-8">
      {showEntryPrompt && !session.hasHistory ? (
        <StylistEntryPrompt
          onSelectOccasion={handleOccasionSelect}
          onSkip={() => setShowEntryPrompt(false)}
          emptyWardrobe={!isLoadingClothes && clothes.length === 0}
          onAddClothes={onAddClothes}
        />
      ) : null}

      {!(showEntryPrompt && !session.hasHistory) ? (
        <>
          <AIStylistBottomSheet
            open={isAIStylistOpen}
            onClose={() => setIsAIStylistOpen(false)}
            mode={stylistMode}
            onModeChange={handleModeChange}
            preferences={preferences}
            onPreferencesChange={setPreferences}
            anchoredItems={anchoredItems}
            onUnanchorItem={unanchorItem}
            onAnchorAllPreview={anchorAllPreviewItems}
            canAnchorAll={previewItems.length > 0}
            status={displayStatus}
            errorMessage={stylistError}
            errorCode={stylistErrorCode}
            credits={credits}
            clothesCount={clothes.length}
            canGenerate={canGenerate}
            onGenerate={() => void runGeneration()}
            onBuyCredits={onBuyCredits}
            hasHistory={session.hasHistory}
            refinementPrompt={refinementPrompt}
            onRefinementPromptChange={setRefinementPrompt}
            onRefine={handleRefine}
          />

          <AIStylistSidebar
            open={isAIStylistOpen}
            onClose={() => setIsAIStylistOpen(false)}
            mode={stylistMode}
            onModeChange={handleModeChange}
            preferences={preferences}
            onPreferencesChange={setPreferences}
            anchoredItems={anchoredItems}
            onUnanchorItem={unanchorItem}
            onAnchorAllPreview={anchorAllPreviewItems}
            canAnchorAll={previewItems.length > 0}
            status={displayStatus}
            errorMessage={stylistError}
            errorCode={stylistErrorCode}
            credits={credits}
            clothesCount={clothes.length}
            canGenerate={canGenerate}
            onGenerate={() => void runGeneration()}
            onBuyCredits={onBuyCredits}
            hasHistory={session.hasHistory}
            refinementPrompt={refinementPrompt}
            onRefinementPromptChange={setRefinementPrompt}
            onRefine={handleRefine}
          />

          <WardrobeDrawer
            open={isWardrobeDrawerOpen}
            onClose={() => {
              setIsWardrobeDrawerOpen(false);
              exitSwapMode();
            }}
            isLoadingClothes={isLoadingClothes}
            error={error}
            clothes={clothes}
            selectedItems={selectedItems}
            toggleSelect={toggleSelect}
            infiniteScrollRef={infiniteScrollRef}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            lastSelectedItemId={lastSelectedItemId}
            swapMode={swapMode}
            swapTargetSlot={swapTargetSlot}
            onCancelSwap={exitSwapMode}
            onAddClothes={onAddClothes}
            anchoredItemIds={anchoredItemIds}
            onToggleAnchor={toggleAnchorItem}
          />

          <MobileGenerationHistorySheet
            open={isHistorySheetOpen}
            onClose={() => setIsHistorySheetOpen(false)}
            generationLabel={session.generationLabel}
            canGoPrev={session.activeIndex > 0}
            canGoNext={session.activeIndex < session.generations.length - 1}
            onHistoryPrev={session.goPrev}
            onHistoryNext={session.goNext}
            prompt={session.activeGeneration?.prompt}
          />

          <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-1 flex-col md:h-auto">
            <div className="hidden md:block">
              <OutfitBuilderHeader
                name={name}
                onNameChange={setName}
                selectedCount={filledSlotCount}
                saving={saving}
                canSave={canSave}
                onSave={saveOutfit}
              />
            </div>

            <MobileOutfitBuilderShell
              name={name}
              onNameChange={setName}
              filledSlotCount={filledSlotCount}
              selectedBySlot={selectedBySlot}
              setSelectedBySlot={setSelectedBySlot}
              anchoredItemIds={anchoredItemIds}
              onToggleAnchor={toggleAnchorItem}
              onRemoveItem={removeItemFromPreview}
              onAnchorAllPreview={anchorAllPreviewItems}
              swapMode={swapMode}
              swapTargetSlot={swapTargetSlot}
              onReplaceSlot={enterSwapMode}
              previewHighlight={previewHighlight}
              recommendations={session.recommendations}
              clothesById={clothesById}
              activeGeneratedIndex={activeGeneratedIndex}
              onActiveGeneratedIndexChange={setActiveGeneratedIndex}
              carouselReturnNonce={carouselReturnNonce}
              feedbackSubmitted={feedbackSubmitted}
              onFeedback={handleFeedback}
              onUseOutfit={handleUseOutfit}
              onOpenAI={openAISheet}
              onOpenWardrobe={() => setIsWardrobeDrawerOpen(true)}
              onOpenHistory={() => setIsHistorySheetOpen(true)}
              generationLabel={session.generationLabel}
              hasHistory={session.hasHistory}
              appliedConfirmation={appliedConfirmation}
              saving={saving}
              canSave={canSave}
              onSave={saveOutfit}
              flashCarouselNext={flashCarouselNext}
              onDismissCarouselNextHint={() => setFlashCarouselNext(false)}
            />

            <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-2 xl:items-start">
              <section
                id="builder-panel-clothes"
                className={`min-h-0 ${panelHeightClass}`}
              >
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
                  onCategoryFilterChange={setCategoryFilter}
                  lastSelectedItemId={lastSelectedItemId}
                  swapMode={swapMode}
                  swapTargetSlot={swapTargetSlot}
                  onCancelSwap={exitSwapMode}
                  onAddClothes={onAddClothes}
                  anchoredItemIds={anchoredItemIds}
                  onToggleAnchor={toggleAnchorItem}
                  className="h-full"
                />
              </section>

              <DesktopOutfitBuilderShell
                filledSlotCount={filledSlotCount}
                selectedBySlot={selectedBySlot}
                setSelectedBySlot={setSelectedBySlot}
                anchoredItemIds={anchoredItemIds}
                onToggleAnchor={toggleAnchorItem}
                onRemoveItem={removeItemFromPreview}
                onAnchorAllPreview={anchorAllPreviewItems}
                swapMode={swapMode}
                swapTargetSlot={swapTargetSlot}
                onReplaceSlot={enterSwapMode}
                previewHighlight={previewHighlight}
                recommendations={session.recommendations}
                clothesById={clothesById}
                activeGeneratedIndex={activeGeneratedIndex}
                onActiveGeneratedIndexChange={setActiveGeneratedIndex}
                feedbackSubmitted={feedbackSubmitted}
                onFeedback={handleFeedback}
                onUseOutfit={handleUseOutfit}
                onOpenAI={openAISheet}
                onOpenHistory={() => setIsHistorySheetOpen(true)}
                generationLabel={session.generationLabel}
                hasHistory={session.hasHistory}
                appliedConfirmation={appliedConfirmation}
                isGenerating={isGenerating}
                panelHeightClass={panelHeightClass}
                flashCarouselNext={flashCarouselNext}
                onDismissCarouselNextHint={() => setFlashCarouselNext(false)}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default CreateOutfitUI;
