"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Heart,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash,
} from "lucide-react";
import { ClothingItem, Outfit } from "../../types/clothes";
import { useOutfits } from "../../hooks/useOutfits";
import { useUpdateClothing } from "../../hooks/useUpdateClothing";
import { useDeleteClothing } from "../../hooks/useDeleteClothing";
import { useClothingEnrichmentPoll } from "../../hooks/useClothingEnrichmentPoll";
import { useClothesData } from "../../hooks/useClothesData";
import { useFavouritesStore } from "../../store/useFavouritesStore";
import OutfitBrowser from "../PreviewOutfit/OutfitBrowser";
import ClothingMetadataEditor from "./ClothingMetadataEditor";
import ContextualStylistAction from "../../components/ux/ContextualStylistAction";
import InlineSuccessState from "../../components/ux/InlineSuccessState";
import {
  clothingItemToDraft,
  validateClothingMetadata,
  ClothingMetadataDraft,
} from "../../utils/validateClothingMetadata";
import { humanizeClothingSubtype } from "../../utils/clothingSubtype";

type ClothingDetailsViewProps = {
  item: ClothingItem;
  onBack: () => void;
  onItemUpdated?: (item: ClothingItem) => void;
  onStyleItem?: (item: ClothingItem) => void;
  onAddToOutfit?: (item: ClothingItem) => void;
  onSelectOutfit?: (outfit: Outfit) => void;
};

function MetadataChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-almaari-accent-soft px-2.5 py-1 text-xs font-medium text-almaari-ink">
      {label}
    </span>
  );
}

export default function ClothingDetailsView({
  item,
  onBack,
  onItemUpdated,
  onStyleItem,
  onAddToOutfit,
  onSelectOutfit,
}: ClothingDetailsViewProps) {
  const [displayItem, setDisplayItem] = useState(item);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ClothingMetadataDraft>(() =>
    clothingItemToDraft(item),
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: outfits = [], isLoading } = useOutfits();
  const { clothes } = useClothesData();
  const updateClothing = useUpdateClothing();
  const deleteClothing = useDeleteClothing(displayItem._id);
  const isFavourite = useFavouritesStore((s) =>
    s.clothingIds.includes(displayItem._id),
  );
  const toggleClothing = useFavouritesStore((s) => s.toggleClothing);

  useClothingEnrichmentPoll(
    displayItem._id,
    displayItem.stylingMetadata?.enrichmentStatus,
    !isEditing,
  );

  useEffect(() => {
    const fresh = clothes.find((entry) => entry._id === item._id);
    if (!fresh?.stylingMetadata) return;

    const prevMeta = displayItem.stylingMetadata;
    const nextMeta = fresh.stylingMetadata;
    if (
      prevMeta?.enrichmentStatus === nextMeta?.enrichmentStatus &&
      prevMeta?.styleCategory === nextMeta?.styleCategory &&
      prevMeta?.userReviewedAt === nextMeta?.userReviewedAt &&
      JSON.stringify(prevMeta?.occasionTags || []) ===
        JSON.stringify(nextMeta?.occasionTags || [])
    ) {
      return;
    }

    setDisplayItem(fresh);
    if (!isEditing) setDraft(clothingItemToDraft(fresh));
    onItemUpdated?.(fresh);
  }, [clothes, item._id, displayItem.stylingMetadata, isEditing, onItemUpdated]);

  useEffect(() => {
    setDisplayItem(item);
    setDraft(clothingItemToDraft(item));
    setIsEditing(false);
    setFeedback(null);
    setAdvancedOpen(false);
  }, [item]);

  const relatedOutfits = useMemo(
    () =>
      outfits.filter((outfit) =>
        outfit.outfit_items.some(
          (outfitItem) => outfitItem._id === displayItem._id,
        ),
      ),
    [outfits, displayItem._id],
  );

  const subtypeLabel = humanizeClothingSubtype(displayItem);
  const primaryChips = [
    displayItem.type,
    ...(displayItem.colour?.slice(0, 2) ?? []),
    displayItem.stylingMetadata?.styleCategory,
  ].filter(Boolean) as string[];

  const advancedChips = [
    subtypeLabel !== displayItem.type ? subtypeLabel : null,
    displayItem.material,
    displayItem.fit,
    displayItem.pattern,
    displayItem.slot
      ? displayItem.slot.charAt(0).toUpperCase() + displayItem.slot.slice(1)
      : null,
    ...(displayItem.stylingMetadata?.occasionTags || []),
  ].filter(Boolean) as string[];

  const handleSave = async () => {
    const validationError = validateClothingMetadata(draft);
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }
    setFeedback(null);
    try {
      const updated = await updateClothing.mutateAsync({
        ...draft,
        uniqueId: displayItem._id,
      });
      setDisplayItem(updated);
      onItemUpdated?.(updated);
      setIsEditing(false);
      setFeedback({ type: "success", message: "Saved" });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to save changes.",
      });
    }
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    try {
      await deleteClothing.mutateAsync();
      onBack();
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete item.",
      });
    }
  };

  return (
    <div className="mx-auto min-h-full w-full max-w-3xl bg-almaari-bg pb-8">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-almaari-bg/95 px-3 py-3 backdrop-blur-md safe-pt">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="touch-target inline-flex items-center justify-center rounded-full text-almaari-ink hover:bg-almaari-accent-soft"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="relative flex items-center gap-1">
          <button
            type="button"
            aria-label={isFavourite ? "Unfavourite" : "Favourite"}
            aria-pressed={isFavourite}
            onClick={() => toggleClothing(displayItem._id)}
            className="touch-target inline-flex items-center justify-center rounded-full"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavourite ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </button>
          <button
            type="button"
            aria-label="More actions"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="touch-target inline-flex items-center justify-center rounded-full"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen ? (
            <div
              className="absolute right-0 top-full z-30 mt-1 min-w-[9rem] overflow-hidden rounded-xl bg-almaari-surface-raised py-1 shadow-soft"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={deleteClothing.isPending}
              >
                <Trash className="h-3.5 w-3.5" />
                {deleteClothing.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative mx-3 aspect-[4/5] overflow-hidden rounded-almaari-lg bg-almaari-warm shadow-card sm:aspect-[16/12] sm:max-h-[28rem]">
        <Image
          src={displayItem.imageSrc}
          alt={subtypeLabel}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 640px"
        />
      </div>

      <div className="space-y-5 px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl text-almaari-ink">
            {isEditing ? draft.type || displayItem.type : subtypeLabel}
          </h1>
          <InlineSuccessState show={feedback?.type === "success"} />
        </div>

        {feedback?.type === "error" ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {feedback.message}
          </p>
        ) : null}

        {!isEditing ? (
          <>
            <div className="flex flex-wrap gap-2">
              <ContextualStylistAction
                primary
                label="Style this item"
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => onStyleItem?.(displayItem)}
              />
              <ContextualStylistAction
                label="Edit"
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => {
                  setDraft(clothingItemToDraft(displayItem));
                  setIsEditing(true);
                }}
              />
              <ContextualStylistAction
                label="Add to outfit"
                onClick={() => onAddToOutfit?.(displayItem)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {primaryChips.map((chip) => (
                <MetadataChip key={chip} label={chip} />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              className="text-sm font-semibold text-almaari-accent"
              aria-expanded={advancedOpen}
            >
              {advancedOpen ? "Hide details" : "More details"}
            </button>

            {advancedOpen ? (
              <div className="flex flex-wrap gap-2">
                {advancedChips.map((chip) => (
                  <MetadataChip key={chip} label={chip} />
                ))}
              </div>
            ) : null}

            {displayItem.stylingMetadata?.enrichmentStatus &&
            ["pending", "processing", "failed"].includes(
              displayItem.stylingMetadata.enrichmentStatus,
            ) ? (
              <p className="text-xs text-almaari-muted">
                {displayItem.stylingMetadata.enrichmentStatus === "failed"
                  ? "Style analysis unavailable"
                  : "Adding style details…"}
              </p>
            ) : null}
          </>
        ) : (
          <div className="space-y-3">
            <ClothingMetadataEditor
              value={draft}
              onChange={setDraft}
              enrichmentStatus={
                displayItem.stylingMetadata?.enrichmentStatus ?? null
              }
              userReviewedAt={
                displayItem.stylingMetadata?.userReviewedAt ?? null
              }
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDraft(clothingItemToDraft(displayItem));
                  setIsEditing(false);
                }}
                className="min-h-touch flex-1 rounded-almaari border border-almaari-border text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateClothing.isPending}
                className="min-h-touch flex-1 rounded-almaari bg-almaari-accent text-sm font-semibold text-white disabled:opacity-60"
              >
                {updateClothing.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        )}

        <section>
          <h2 className="mb-3 font-display text-lg text-almaari-ink">
            Outfit ideas
          </h2>
          <OutfitBrowser
            outfits={relatedOutfits}
            loading={isLoading}
            title=""
            emptyMessage="No outfits with this piece yet."
            onSelectOutfit={onSelectOutfit}
          />
        </section>
      </div>
    </div>
  );
}
