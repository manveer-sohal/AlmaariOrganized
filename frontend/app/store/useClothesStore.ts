import { create } from "zustand";

type Slot = "head" | "body" | "legs" | "feet";
type ClothingItemProps = {
  slot: Slot;
  _id: string;
  colour: string[];
  type: string;
  imageSrc: string;
};

type ClothesStore = {
  clothes: ClothingItemProps[];
  addClothingItem: (item: ClothingItemProps) => void;
  setClothes: (clothes: ClothingItemProps[]) => void;
};

export const useClothesStore = create<ClothesStore>((set) => ({
  clothes: [],
  addClothingItem: (item: ClothingItemProps) =>
    set((state: { clothes: ClothingItemProps[] }) => ({
      clothes: [item, ...state.clothes],
    })),
  setClothes: (clothes: ClothingItemProps[]) => set({ clothes }),
}));
