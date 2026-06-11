import { create } from "zustand";
type Filters = {
  colour: string[];
  type: string[];
  material: string[];
  fit: string[];
  pattern: string[];
  search: string;
};
type ClothesStore = {
  setFilters: (filters: Filters) => void;
  filters: Filters;
  menuOpen: boolean;
  setMenuOpen: (menuOpen: boolean) => void;
  
};

export const useClothesStore = create<ClothesStore>((set) => ({
  setFilters: (filters: Filters) => set({ filters }),
  filters: {
    colour: [],
    type: [],
    material: [],
    fit: [],
    pattern: [],
    search: "",
  },
  menuOpen: false,
  setMenuOpen: (menuOpen: boolean) => set({ menuOpen }),

}));
