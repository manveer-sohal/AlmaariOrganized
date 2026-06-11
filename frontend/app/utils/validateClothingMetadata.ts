import {
  colours_List,
  fits_List,
  materials_List,
  patterns_List,
  type_List,
} from "../data/constants";
import { ClothingItem, Slot } from "../types/clothes";

export type ClothingMetadataDraft = {
  type: string;
  colour: string[];
  material: string;
  fit: string;
  pattern: string;
  slot: Slot;
};

const SLOTS: Slot[] = ["head", "body", "legs", "feet"];

export function clothingItemToDraft(item: ClothingItem): ClothingMetadataDraft {
  return {
    type: item.type,
    colour: [...(item.colour ?? [])],
    material: item.material ?? "",
    fit: item.fit ?? "",
    pattern: item.pattern ?? "",
    slot: item.slot,
  };
}

export function validateClothingMetadata(
  draft: ClothingMetadataDraft,
): string | null {
  if (!type_List.includes(draft.type)) {
    return "Enter a valid clothing type.";
  }
  if (draft.colour.length === 0) {
    return "Add at least one colour.";
  }
  if (!draft.colour.every((colour) => colours_List.includes(colour))) {
    return "One or more colours are invalid.";
  }
  if (!materials_List.includes(draft.material)) {
    return "Enter a valid material.";
  }
  if (!fits_List.includes(draft.fit)) {
    return "Enter a valid fit.";
  }
  if (!patterns_List.includes(draft.pattern)) {
    return "Enter a valid pattern.";
  }
  if (!SLOTS.includes(draft.slot)) {
    return "Select a valid slot.";
  }
  return null;
}

export function normalizeClothingItem(raw: Record<string, unknown>): ClothingItem {
  return {
    _id: String(raw._id),
    type: String(raw.type ?? ""),
    colour: Array.isArray(raw.colour) ? raw.colour.map(String) : [],
    material: raw.material != null ? String(raw.material) : undefined,
    fit: raw.fit != null ? String(raw.fit) : undefined,
    pattern: raw.pattern != null ? String(raw.pattern) : undefined,
    slot: String(raw.slot ?? "body") as Slot,
    imageSrc: String(raw.imageSrc ?? ""),
  };
}
