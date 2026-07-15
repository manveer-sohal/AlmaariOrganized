import { mapTypeToSlot } from "./mapTypeToSlot";

export type CropOverlayId =
  | "none"
  | "top"
  | "pants"
  | "shorts"
  | "skirt"
  | "dress"
  | "shoes"
  | "accessory";

export const CROP_OVERLAY_OPTIONS: {
  id: CropOverlayId;
  label: string;
}[] = [
  { id: "none", label: "No overlay" },
  { id: "top", label: "Top" },
  { id: "pants", label: "Pants" },
  { id: "shorts", label: "Shorts" },
  { id: "skirt", label: "Skirt" },
  { id: "dress", label: "Dress" },
  { id: "shoes", label: "Shoes" },
  { id: "accessory", label: "Accessory" },
];

/**
 * Pick a crop guide from a clothing type label (AI or user).
 * Shirt → top, Jeans → pants, etc.
 */
export function cropOverlayFromClothingType(
  type: string | null | undefined,
): CropOverlayId {
  if (!type?.trim()) return "none";
  const t = type.trim().toLowerCase();

  if (
    t.includes("short") ||
    t.includes("hot pant") ||
    t.includes("bermuda")
  ) {
    return "shorts";
  }
  if (t.includes("skirt") || t.includes("kilt") || t.includes("sarong")) {
    return "skirt";
  }
  if (
    t.includes("dress") ||
    t.includes("jumpsuit") ||
    t.includes("romper") ||
    t.includes("overall") ||
    t.includes("dungaree")
  ) {
    return "dress";
  }
  if (
    t.includes("shoe") ||
    t.includes("boot") ||
    t.includes("sneaker") ||
    t.includes("sandal") ||
    t.includes("heel") ||
    t.includes("loafer") ||
    t.includes("slipper") ||
    t.includes("trainer") ||
    t.includes("sock")
  ) {
    return "shoes";
  }

  const slot = mapTypeToSlot(type);
  if (slot === "body") return "top";
  if (slot === "legs") return "pants";
  if (slot === "feet") return "shoes";
  if (slot === "head") return "accessory";
  return "none";
}
