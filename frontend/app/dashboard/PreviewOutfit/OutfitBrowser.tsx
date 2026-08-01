"use client";

import { useMemo } from "react";
import { Outfit } from "../../types/clothes";
import OutfitCard from "../../components/ux/OutfitCard";
import EmptyState from "../../components/ux/EmptyState";

type OutfitBrowserProps = {
  outfits: Outfit[];
  loading?: boolean;
  title?: string;
  emptyMessage?: string;
  onSelectOutfit?: (outfit: Outfit) => void;
  onImprove?: (outfit: Outfit) => void;
  onCreate?: () => void;
};

function shortReason(outfit: Outfit): string {
  const slots = new Set(outfit.outfit_items.map((i) => i.slot));
  if (slots.size >= 3) return "Balanced full look";
  if (slots.has("body") && slots.has("legs")) return "Works for everyday";
  return "From your wardrobe";
}

export default function OutfitBrowser({
  outfits,
  loading = false,
  title = "Your looks",
  emptyMessage = "Create your first look.",
  onSelectOutfit,
  onImprove,
  onCreate,
}: OutfitBrowserProps) {
  const sorted = useMemo(() => outfits, [outfits]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[4/5] animate-pulse rounded-almaari-lg bg-almaari-chrome/40"
          />
        ))}
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        actionLabel={onCreate ? "Build an outfit" : undefined}
        onAction={onCreate}
      />
    );
  }

  return (
    <div className="space-y-5">
      {title ? (
        <h2 className="font-display text-xl text-almaari-ink">{title}</h2>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {sorted.map((outfit) => (
          <OutfitCard
            key={outfit.uniqueId}
            outfit={outfit}
            reason={shortReason(outfit)}
            onOpen={onSelectOutfit}
            onWear={onSelectOutfit}
            onImprove={onImprove}
          />
        ))}
      </div>
    </div>
  );
}
