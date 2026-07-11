import React, { RefObject, useCallback, useMemo, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQueryClient } from "@tanstack/react-query";
import { ClothingItem, Slot } from "../../types/clothes";
import {
  DEFAULT_STYLIST_PREFERENCES,
  OutfitRecommendation,
  StylistPreferences,
} from "../../types/aiStylist";
import UsersClothes from "./UsersClothes";
import OutfitPreview from "../components/OutfitPreview";
import AiStylistPanel from "./AiStylist";
import StylistConfigModal from "./StylistConfigModal";
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

function CreateOutfitUI({ onBuyCredits }: CreateOutfitUIProps) {
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
  const [activeRecommendationId, setActiveRecommendationId] = useState<
    string | null
  >(null);

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

  const selectedItems = useMemo(() => {
    return Object.values(selectedBySlot).filter(
      (v): v is ClothingItem[] => Array.isArray(v) && v.length > 0,
    );
  }, [selectedBySlot]);

  const clothesById = useMemo(
    () => new Map(clothes?.map((c: ClothingItem) => [c._id, c])),
    [clothes],
  );

  const anchorItem = anchorItemId ? clothesById.get(anchorItemId) : undefined;

  const toggleSelect = useCallback(
    (id: string) => {
      const item = clothesById.get(id) as ClothingItem | undefined;
      if (!item) return;

      setLastSelectedItemId(id);

      if (swapMode) {
        setSelectedBySlot((prev) => {
          const next = { ...prev };
          const slot = item.slot as Slot;
          next[slot] = [item];
          return next;
        });
        setSwapMode(false);
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
    [clothesById, swapMode],
  );

  const openGenerateModal = (mode: "generate" | "style-item") => {
    if (credits != null && credits < 1) {
      onBuyCredits?.();
      return;
    }
    setConfigMode(mode);
    if (mode === "style-item" && lastSelectedItemId) {
      setAnchorItemId(lastSelectedItemId);
    } else {
      setAnchorItemId(undefined);
    }
    setConfigOpen(true);
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
    setActiveRecommendationId(recommendation.id);
    setSwapMode(false);
  };

  const handleFeedback = (
    recommendation: OutfitRecommendation,
    rating: "positive" | "negative",
  ) => {
    setFeedbackSubmitted((prev) => ({ ...prev, [recommendation.id]: rating }));
    submitFeedback({
      recommendationId: recommendation.id,
      outfitItemIds: recommendation.itemIds,
      rating,
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
      setActiveRecommendationId(null);
      queryClient.invalidateQueries({ queryKey: ["user", user?.sub] });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="md:rounded-tl-3xl w-full z-10 p-4 pb-24 md:pb-8">
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

      <div className="flex items-center justify-between mb-4 md:mr-40">
        <div className="flex justify-end w-full gap-2 ">
          <input
            id="create-outfit-form-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Outfit name (optional)"
            className=" w-full md:w-1/2 rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            disabled={saving || selectedItems.length === 0}
            onClick={saveOutfit}
            className="inline-flex items-center justify-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Outfit"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.6fr,0.9fr] gap-4">
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
        />

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-[clamp(200px,20vw,330px),1fr] gap-4">
          <OutfitPreview
            selectedBySlot={selectedBySlot}
            setSelectedBySlot={setSelectedBySlot}
          />

          <AiStylistPanel
            status={isGenerating ? "loading" : stylistStatus}
            recommendations={recommendations}
            clothesById={clothesById}
            errorMessage={stylistError}
            errorCode={stylistErrorCode}
            credits={credits}
            clothesCount={clothes.length}
            feedbackSubmitted={feedbackSubmitted}
            onGenerateClick={() => openGenerateModal("generate")}
            onTryAnother={() => openGenerateModal("generate")}
            onUseOutfit={handleUseOutfit}
            onSwapItem={() => setSwapMode(true)}
            onFeedback={handleFeedback}
            onBuyCredits={onBuyCredits}
          />
        </div>
      </div>

      {activeRecommendationId && (
        <p className="mt-2 text-xs text-indigo-700/80">
          Recommendation applied to preview. Adjust items manually or save when
          ready.
        </p>
      )}
    </div>
  );
}

export default CreateOutfitUI;
