import { create } from "zustand";

type Filters = {
  colour: string[];
  type: string[];
  search: string;
};
type ClothesStore = {
  setFilters: (filters: Filters) => void;
  filters: Filters;
};

export const useClothesStore = create<ClothesStore>((set) => ({
  setFilters: (filters: Filters) => set({ filters }),
  filters: {
    colour: [],
    type: [],
    search: "",
  },
}));
