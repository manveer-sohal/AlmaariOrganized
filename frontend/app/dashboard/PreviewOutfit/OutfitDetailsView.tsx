"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Heart, Sparkles, Trash2 } from "lucide-react";
import { ClothingItem, Outfit, Slot } from "../../types/clothes";
import { SLOT_LABELS } from "../../types/aiStylist";
import BuilderOutfitPreview from "../CreateOutfit/BuilderOutfitPreview";
import MobilePageHeader from "../../components/ux/MobilePageHeader";
import { useFavouritesStore } from "../../store/useFavouritesStore";
import { humanizeClothingSubtype } from "../../utils/clothingSubtype";

const SLOT_ORDER: Slot[] = ["head", "body", "legs", "feet"];

type OutfitDetailsViewProps = {
  outfit: Outfit;
  onBack: () => void;
  onDelete?: (id: string) => void;
  onImprove?: (outfit: Outfit) => void;
  onSelectItem?: (item: ClothingItem) => void;
};

function outfitToSlots(
  outfit: Outfit,
): Partial<Record<Slot, ClothingItem[] | null>> {
  const slots: Partial<Record<Slot, ClothingItem[] | null>> = {
    head: null,
    body: null,
    legs: null,
    feet: null,
  };
  for (const item of outfit.outfit_items) {
    const slot = item.slot as Slot;
    const existing = slots[slot] || [];
    slots[slot] = [...existing, item];
  }
  return slots;
}

export default function OutfitDetailsView({
  outfit,
  onBack,
  onDelete,
  onImprove,
  onSelectItem,
}: OutfitDetailsViewProps) {
  const isFavourite = useFavouritesStore((s) =>
    s.outfitIds.includes(outfit.uniqueId),
  );
  const toggleOutfit = useFavouritesStore((s) => s.toggleOutfit);

  const selectedBySlot = useMemo(() => outfitToSlots(outfit), [outfit]);

  const piecesBySlot = useMemo(() => {
    return SLOT_ORDER.map((slot) => ({
      slot,
      label: SLOT_LABELS[slot] || slot,
      items: selectedBySlot[slot] || [],
    })).filter((group) => group.items.length > 0);
  }, [selectedBySlot]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col bg-almaari-bg pb-nav md:pb-8">
      <MobilePageHeader
        title={outfit.name}
        subtitle={`${outfit.outfit_items.length} ${
          outfit.outfit_items.length === 1 ? "piece" : "pieces"
        }`}
        onBack={onBack}
        trailing={
          <button
            type="button"
            aria-label={isFavourite ? "Unfavourite outfit" : "Favourite outfit"}
            aria-pressed={isFavourite}
            onClick={() => toggleOutfit(outfit.uniqueId)}
            className="touch-target inline-flex items-center justify-center rounded-full text-almaari-ink"
          >
            <Heart
              className={`h-5 w-5 ${
                isFavourite ? "fill-rose-500 text-rose-500" : ""
              }`}
            />
          </button>
        }
      />

      <div className="flex flex-col gap-6 px-4 pt-4">
        <section
          className="overflow-hidden rounded-almaari-lg bg-gradient-to-b from-almaari-surface-raised to-almaari-bg"
          aria-label="Outfit preview"
        >
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[20rem] sm:max-w-[22rem]">
            <div className="absolute inset-0">
              <BuilderOutfitPreview
                selectedBySlot={selectedBySlot}
                setSelectedBySlot={() => {}}
                readOnly
                fill
                className="h-full w-full max-w-full overflow-hidden !border-0 !bg-transparent !shadow-none"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-2">
          {onImprove ? (
            <button
              type="button"
              onClick={() => onImprove(outfit)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-almaari bg-almaari-accent px-4 text-sm font-semibold text-white"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Improve look
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(outfit.uniqueId)}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-almaari border border-red-200 bg-white px-4 text-sm font-semibold text-red-700"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete
            </button>
          ) : null}
        </div>

        <section aria-label="Clothes in this outfit">
          <h2 className="mb-3 font-display text-lg text-almaari-ink">
            Clothes in this look
          </h2>
          <div className="space-y-5">
            {piecesBySlot.map(({ slot, label, items }) => (
              <div key={slot}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-almaari-muted">
                  {label}
                </p>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {items.map((item) => {
                    const subtype = humanizeClothingSubtype(item);
                    return (
                      <li key={item._id}>
                        <button
                          type="button"
                          onClick={() => onSelectItem?.(item)}
                          disabled={!onSelectItem}
                          className="group flex w-full flex-col overflow-hidden rounded-almaari border border-almaari-border bg-almaari-surface-raised text-left transition hover:border-almaari-accent disabled:cursor-default"
                        >
                          <div className="relative aspect-square w-full bg-almaari-warm">
                            <Image
                              src={item.imageSrc}
                              alt={subtype}
                              fill
                              className="object-cover transition group-hover:scale-[1.02]"
                              sizes="(max-width: 640px) 45vw, 180px"
                            />
                          </div>
                          <div className="space-y-0.5 px-2.5 py-2">
                            <p className="truncate text-sm font-semibold text-almaari-ink">
                              {subtype}
                            </p>
                            <p className="truncate text-xs text-almaari-muted">
                              {label}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
