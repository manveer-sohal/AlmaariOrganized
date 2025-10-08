import { create } from "zustand";

type ClothingItemProps = {
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
      clothes: [...state.clothes, item],
    })),
  setClothes: (clothes: ClothingItemProps[]) => set({ clothes }),
}));
