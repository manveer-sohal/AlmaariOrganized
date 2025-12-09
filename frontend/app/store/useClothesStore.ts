import { create } from "zustand";
type Filters = {
  colour: string[];
  type: string[];
  search: string;
};
type ClothesStore = {
  setFilters: (filters: Filters) => void;
  filters: Filters;
  menuOpen: boolean;
  setMenuOpen: (menuOpen: boolean) => void;
  isMobile: boolean;
  setIsMobile: (isMobile: boolean) => void;
};

export const useClothesStore = create<ClothesStore>((set) => ({
  setFilters: (filters: Filters) => set({ filters }),
  filters: {
    colour: [],
    type: [],
    search: "",
  },
  menuOpen: false,
  setMenuOpen: (menuOpen: boolean) => set({ menuOpen }),
  isMobile: true,
  setIsMobile: (isMobile: boolean) => set({ isMobile }),
}));
