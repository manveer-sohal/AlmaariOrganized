"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import OutfitOption from "./outfitOption";
import { ClothingItem, Outfit } from "../../types/clothes";
import OutfitPreview from "../components/OutfitPreview";

type OutfitBrowserProps = {
  outfits: Outfit[];
  loading?: boolean;
  title?: string;
  emptyMessage?: string;
  showDelete?: boolean;
  onDeleteOutfit?: (id: string) => void;
};

export default function OutfitBrowser({
  outfits,
  loading = false,
  title = "Your Outfits",
  emptyMessage = "No outfits yet.",
  showDelete = true,
  onDeleteOutfit,
}: OutfitBrowserProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (outfits.length === 0) {
      setActiveId(null);
      return;
    }

    const stillExists = activeId
      ? outfits.some((o) => o.uniqueId === activeId)
      : false;

    if (!stillExists) {
      setActiveId(outfits[0].uniqueId);
    }
  }, [outfits, activeId]);

  const activeOutfit = useMemo(
    () => outfits.find((o) => o.uniqueId === activeId) || null,
    [outfits, activeId],
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[260px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
      </div>
    );
  }

  if (outfits.length === 0) {
    return <p className="text-indigo-900">{emptyMessage}</p>;
  }

  return (
    <>
      {title ? (
        <h3 className="font-medium text-indigo-900 mb-3">{title}</h3>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          {outfits.map((o) => (
            <OutfitOption
              key={o.uniqueId}
              outfit={o}
              activeId={activeId}
              setActiveId={setActiveId}
              showDelete={showDelete}
              onDelete={
                showDelete && onDeleteOutfit
                  ? () => onDeleteOutfit(o.uniqueId)
                  : () => {}
              }
            />
          ))}
        </div>

        <div className="md:col-span-2">
          {!activeOutfit ? (
            <div className="text-indigo-900">Select an outfit to preview</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-[350px] lg:h-[calc(100vh-280px)]">
              <div className="w-full">
                <OutfitPreview
                  selectedBySlot={{
                    head: activeOutfit.outfit_items.filter(
                      (item: ClothingItem) => item.slot === "head",
                    ),
                    body: activeOutfit.outfit_items.filter(
                      (item: ClothingItem) => item.slot === "body",
                    ),
                    legs: activeOutfit.outfit_items.filter(
                      (item: ClothingItem) => item.slot === "legs",
                    ),
                    feet: activeOutfit.outfit_items.filter(
                      (item: ClothingItem) => item.slot === "feet",
                    ),
                  }}
                  setSelectedBySlot={() => {}}
                />
              </div>
              <div className="flex flex-col gap-3 lg:h-[calc(100vh-280px)] overflow-y-auto border border-indigo-200 rounded-lg p-3">
                <h4 className="text-indigo-900 font-medium">Outfit Items</h4>
                <div className="overflow-y-auto lg:max-h-[calc(100vh-320px)] shadow-inner shadow-indigo-200 border border-indigo-200 rounded-lg">
                  {activeOutfit.outfit_items.map((item: ClothingItem) => (
                    <div
                      key={item._id}
                      className="border-b last:border-b-0 border-indigo-200 p-2 flex items-center gap-3 h-[100px]"
                    >
                      <Image
                        src={item.imageSrc}
                        alt={item.type}
                        width={80}
                        height={80}
                        className="rounded object-cover shrink-0"
                      />
                      <div>
                        <div className="text-sm text-indigo-900 font-medium">
                          {item.type}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(item.colour || []).slice(0, 6).map((c, idx) => (
                            <span
                              key={`${item._id}-c-${idx}`}
                              className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
