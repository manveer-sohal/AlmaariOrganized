"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil } from "lucide-react";
import { ClothingItem } from "../../types/clothes";
import { useOutfits } from "../../hooks/useOutfits";
import { useUpdateClothing } from "../../hooks/useUpdateClothing";
import OutfitBrowser from "../PreviewOutfit/OutfitBrowser";
import ClothingMetadataEditor from "./ClothingMetadataEditor";
import {
  clothingItemToDraft,
  validateClothingMetadata,
  ClothingMetadataDraft,
} from "../../utils/validateClothingMetadata";

type ClothingDetailsViewProps = {
  item: ClothingItem;
  onBack: () => void;
  onItemUpdated?: (item: ClothingItem) => void;
};

function MetadataChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-900 border border-indigo-200">
      {label}
    </span>
  );
}

function MetadataRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <dt className="text-sm font-medium text-indigo-700 sm:w-28 shrink-0">
        {label}
      </dt>
      <dd className="flex flex-wrap gap-2">{children}</dd>
    </div>
  );
}

export default function ClothingDetailsView({
  item,
  onBack,
  onItemUpdated,
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

  const { data: outfits = [], isLoading } = useOutfits();
  const updateClothing = useUpdateClothing();

  useEffect(() => {
    setDisplayItem(item);
    setDraft(clothingItemToDraft(item));
    setIsEditing(false);
    setFeedback(null);
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

  const metadataRows = [
    {
      label: "Type",
      value: displayItem.type,
      render: () => <MetadataChip label={displayItem.type} />,
    },
    {
      label: "Colours",
      value: displayItem.colour?.length,
      render: () =>
        displayItem.colour.map((colour) => (
          <MetadataChip key={colour} label={colour} />
        )),
    },
    {
      label: "Material",
      value: displayItem.material,
      render: () => <MetadataChip label={displayItem.material!} />,
    },
    {
      label: "Fit",
      value: displayItem.fit,
      render: () => <MetadataChip label={displayItem.fit!} />,
    },
    {
      label: "Pattern",
      value: displayItem.pattern,
      render: () => <MetadataChip label={displayItem.pattern!} />,
    },
    {
      label: "Slot",
      value: displayItem.slot,
      render: () => (
        <MetadataChip
          label={
            displayItem.slot.charAt(0).toUpperCase() + displayItem.slot.slice(1)
          }
        />
      ),
    },
  ].filter((row) => {
    if (Array.isArray(row.value)) return row.value.length > 0;
    return row.value != null && row.value !== "";
  });

  const handleEdit = () => {
    setDraft(clothingItemToDraft(displayItem));
    setFeedback(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(clothingItemToDraft(displayItem));
    setFeedback(null);
    setIsEditing(false);
  };

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
      setFeedback({ type: "success", message: "Changes saved." });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to save changes.",
      });
    }
  };

  return (
    <div className="bg-indigo-200 p-3 w-full lg:max-w-6xl max-w-5xl mx-auto h-auto md:rounded-tl-3xl">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border border-indigo-300 bg-white/80 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-4 shadow-md w-2/5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 className="font-medium text-indigo-900">Clothing Details</h2>
            {!isEditing ? (
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors duration-200"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={updateClothing.isPending}
                  className="px-3 py-2 rounded-xl border border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-100 transition-colors duration-200 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateClothing.isPending}
                  className="px-3 py-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-60"
                >
                  {updateClothing.isPending ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {feedback && (
            <p
              className={`mb-4 text-sm rounded-lg px-3 py-2 border ${
                feedback.type === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {feedback.message}
            </p>
          )}

          <div className="relative w-full max-w-80 mx-auto aspect-square rounded-xl overflow-hidden border border-indigo-200 shadow-md mb-3">
            <Image
              src={displayItem.imageSrc}
              alt={displayItem.type}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              priority
            />
          </div>

          <h3 className="text-xl font-semibold text-indigo-900 mb-4">
            {isEditing ? draft.type || displayItem.type : displayItem.type}
          </h3>

          {isEditing ? (
            <ClothingMetadataEditor value={draft} onChange={setDraft} />
          ) : (
            <dl className="space-y-4">
              {metadataRows.map((row) => (
                <MetadataRow key={row.label} label={row.label}>
                  {row.render()}
                </MetadataRow>
              ))}
            </dl>
          )}
        </div>

        <div className="w-3/5 bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-4 shadow-md flex-2">
          <OutfitBrowser
            outfits={relatedOutfits}
            loading={isLoading}
            title="Outfits Using This Item"
            emptyMessage="This item is not used in any outfits yet."
            showDelete={false}
          />
        </div>
      </div>
    </div>
  );
}
