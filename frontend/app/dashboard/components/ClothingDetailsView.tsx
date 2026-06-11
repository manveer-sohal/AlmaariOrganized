"use client";

import Image from "next/image";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Trash } from "lucide-react";
import { ClothingItem } from "../../types/clothes";
import { useOutfits } from "../../hooks/useOutfits";
import { useUpdateClothing } from "../../hooks/useUpdateClothing";
import { useDeleteClothing } from "../../hooks/useDeleteClothing";
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
    <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm bg-indigo-100 text-indigo-900 border border-indigo-200">
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
  const [mobileSection, setMobileSection] = useState<"details" | "outfits">(
    "details",
  );

  const { data: outfits = [], isLoading } = useOutfits();
  const updateClothing = useUpdateClothing();
  const deleteClothing = useDeleteClothing(displayItem._id);

  useEffect(() => {
    setDisplayItem(item);
    setDraft(clothingItemToDraft(item));
    setIsEditing(false);
    setFeedback(null);
    setMobileSection("details");
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

  const handleDelete = async () => {
    setFeedback(null);
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

  const displayTitle = isEditing
    ? draft.type || displayItem.type
    : displayItem.type;

  const mobileDeleteButton = (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleteClothing.isPending || isEditing}
      aria-label="Delete clothing item"
      className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-500 hover:text-white active:bg-red-600 transition-colors duration-200 text-sm shrink-0 disabled:opacity-60"
    >
      <Trash className="w-3.5 h-3.5" />
      {deleteClothing.isPending ? "Deleting…" : "Delete"}
    </button>
  );

  const editActions = !isEditing ? (
    <button
      type="button"
      onClick={handleEdit}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-indigo-600 transition-colors duration-200 text-sm shrink-0"
    >
      <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      Edit
    </button>
  ) : (
    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
      <button
        type="button"
        onClick={handleCancel}
        disabled={updateClothing.isPending}
        className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-indigo-300 bg-white text-indigo-900 hover:bg-indigo-100 transition-colors duration-200 disabled:opacity-60 text-sm"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={updateClothing.isPending}
        className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-60 text-sm"
      >
        {updateClothing.isPending ? "Saving..." : "Save"}
      </button>
    </div>
  );

  return (
    <div className="bg-indigo-200 px-2 py-2 pb-20 sm:p-3 sm:pb-3 w-full max-w-5xl lg:max-w-6xl mx-auto h-auto overflow-x-hidden md:rounded-tl-3xl">
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-indigo-300 bg-white/80 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-indigo-600 transition-colors duration-200 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="md:hidden flex items-center gap-1.5">
          {mobileDeleteButton}
          {editActions}
        </div>
      </div>

      {/* Mobile: switch between details and outfits to avoid long scroll */}
      <div className="md:hidden flex rounded-xl border border-indigo-200 bg-white/80 p-1 mb-2 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileSection("details")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mobileSection === "details"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-indigo-800 hover:bg-indigo-50"
          }`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setMobileSection("outfits")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            mobileSection === "outfits"
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-indigo-800 hover:bg-indigo-50"
          }`}
        >
          Outfits ({relatedOutfits.length})
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-2 sm:gap-4">
        <div
          className={`bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 sm:p-4 shadow-md w-full md:w-2/5 ${
            mobileSection === "outfits" ? "hidden md:block" : ""
          }`}
        >
          <div className="hidden md:flex items-start justify-between gap-3 mb-4">
            <h2 className="font-medium text-indigo-900">Clothing Details</h2>
            {editActions}
          </div>

          {feedback && (
            <p
              className={`mb-2 sm:mb-4 text-sm rounded-lg px-3 py-2 border ${
                feedback.type === "success"
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {feedback.message}
            </p>
          )}

          {/* Mobile: compact image + title row */}
          <div
            className={`flex gap-3 items-start mb-3 ${
              isEditing ? "flex-col" : ""
            }`}
          >
            <div
              className={`relative shrink-0 rounded-xl overflow-hidden border border-indigo-200 shadow-md ${
                isEditing
                  ? "w-full max-w-xs mx-auto aspect-square"
                  : "w-28 h-28 sm:w-36 sm:h-36 md:w-full md:max-w-80 md:aspect-square md:mx-auto"
              }`}
            >
              <Image
                src={displayItem.imageSrc}
                alt={displayItem.type}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 144px, 400px"
                priority
              />
            </div>

            {!isEditing && (
              <div className="flex-1 min-w-0 md:hidden pt-0.5">
                <h3 className="text-lg font-semibold text-indigo-900 leading-tight">
                  {displayTitle}
                </h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  {metadataRows.map((row) => (
                    <Fragment key={row.label}>{row.render()}</Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          <h3 className="hidden md:block text-xl font-semibold text-indigo-900 mb-4">
            {displayTitle}
          </h3>

          {isEditing ? (
            <ClothingMetadataEditor value={draft} onChange={setDraft} />
          ) : (
            <>
              <dl className="hidden md:block space-y-4">
                {metadataRows.map((row) => (
                  <MetadataRow key={row.label} label={row.label}>
                    {row.render()}
                  </MetadataRow>
                ))}
              </dl>
            </>
          )}
        </div>

        <div
          className={`w-full md:w-3/5 bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 sm:p-4 shadow-md flex-1 min-h-0 ${
            mobileSection === "details" ? "hidden md:block" : ""
          }`}
        >
          <div className="md:max-h-none max-h-[calc(100vh-220px)] overflow-y-auto">
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
    </div>
  );
}
