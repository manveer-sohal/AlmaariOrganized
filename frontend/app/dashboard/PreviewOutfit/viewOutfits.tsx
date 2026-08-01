"use client";

import OutfitBrowser from "./OutfitBrowser";
import { Outfit } from "../../types/clothes";
import { useOutfits } from "../../hooks/useOutfits";

type ViewOutfitsProps = {
  onImprove?: (outfit: Outfit) => void;
  onSelectOutfit?: (outfit: Outfit) => void;
  onCreate?: () => void;
};

function ViewOutfits({
  onImprove,
  onSelectOutfit,
  onCreate,
}: ViewOutfitsProps) {
  const { data: outfits = [], isLoading: loading } = useOutfits();

  return (
    <div className="mx-auto h-full w-full max-w-5xl px-4 py-4 pb-nav md:pb-8">
      <OutfitBrowser
        outfits={outfits}
        loading={loading}
        title="Outfits"
        emptyMessage="Create your first look."
        onSelectOutfit={onSelectOutfit}
        onImprove={onImprove}
        onCreate={onCreate}
      />
    </div>
  );
}

export default ViewOutfits;
