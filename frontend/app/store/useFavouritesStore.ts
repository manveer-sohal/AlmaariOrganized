"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavouritesStore = {
  clothingIds: string[];
  outfitIds: string[];
  toggleClothing: (id: string) => void;
  toggleOutfit: (id: string) => void;
  isClothingFavourite: (id: string) => boolean;
  isOutfitFavourite: (id: string) => boolean;
};

export const useFavouritesStore = create<FavouritesStore>()(
  persist(
    (set, get) => ({
      clothingIds: [],
      outfitIds: [],
      toggleClothing: (id) =>
        set((state) => ({
          clothingIds: state.clothingIds.includes(id)
            ? state.clothingIds.filter((x) => x !== id)
            : [...state.clothingIds, id],
        })),
      toggleOutfit: (id) =>
        set((state) => ({
          outfitIds: state.outfitIds.includes(id)
            ? state.outfitIds.filter((x) => x !== id)
            : [...state.outfitIds, id],
        })),
      isClothingFavourite: (id) => get().clothingIds.includes(id),
      isOutfitFavourite: (id) => get().outfitIds.includes(id),
    }),
    { name: "almaari-favourites" },
  ),
);
