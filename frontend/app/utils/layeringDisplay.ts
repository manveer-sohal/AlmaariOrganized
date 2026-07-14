import { ClothingItem } from "../types/clothes";
import {
  LAYER_ROLE_LABELS,
  OutfitLayering,
  WearState,
  WEAR_STATE_LABELS,
} from "../types/aiStylist";
import { humanizeClothingSubtype } from "./clothingSubtype";

export type LayerDisplayRow = {
  itemId: string;
  role: string;
  roleLabel: string;
  wearState?: WearState;
  wearLabel?: string;
  displayName: string;
  item?: ClothingItem;
};

const isBeltItem = (item?: ClothingItem) => {
  if (!item) return false;
  const name = (item as ClothingItem & { name?: string }).name || "";
  const hay = `${item.type || ""} ${name}`.toLowerCase();
  return /\bbelt\b/.test(hay);
};

/** Humanize garment names for cards — never claim open without wearState. */
export function humanizeGarmentLabel(item?: ClothingItem): string {
  if (!item) return "Item";
  return humanizeClothingSubtype(item);
}

/**
 * Build human-readable upper-body layer rows for cards / preview.
 * Only appends open/closed when wearState is explicitly set and meaningful.
 */
export function buildLayerDisplayRows(
  layering: OutfitLayering | undefined,
  clothesById: Map<string, ClothingItem>,
): LayerDisplayRow[] {
  if (!layering) return [];

  const rows: Array<{ id?: string; role: string }> = [
    { id: layering.baseTopId, role: "base_top" },
    { id: layering.midLayerId, role: "mid_layer" },
    { id: layering.outerLayerId, role: "outer_layer" },
    { id: layering.neckwearId, role: "neckwear" },
  ];

  return rows
    .filter((row): row is { id: string; role: string } => Boolean(row.id))
    .map((row) => {
      const item = clothesById.get(row.id);
      const wearState = layering.wearState?.[row.id] as WearState | undefined;
      const showWear =
        wearState === "open" || wearState === "closed"
          ? WEAR_STATE_LABELS[wearState]
          : undefined;
      return {
        itemId: row.id,
        role: row.role,
        roleLabel: LAYER_ROLE_LABELS[row.role] || row.role,
        wearState,
        wearLabel: showWear || undefined,
        displayName: humanizeGarmentLabel(item),
        item,
      };
    });
}

export function buildBeltDisplayRow(
  layering: OutfitLayering | undefined,
  clothesById: Map<string, ClothingItem>,
  itemIds: string[] = [],
): LayerDisplayRow | null {
  const beltId =
    layering?.waistAccessoryId ||
    itemIds.find((id) => isBeltItem(clothesById.get(id)));
  if (!beltId) return null;
  const item = clothesById.get(beltId);
  if (!item || !isBeltItem(item)) return null;
  return {
    itemId: beltId,
    role: "waist_accessory",
    roleLabel: "Belt",
    displayName: humanizeGarmentLabel(item),
    item,
  };
}

export function hasMeaningfulLayering(
  layering: OutfitLayering | undefined,
): boolean {
  if (!layering) return false;
  const count = [
    layering.baseTopId,
    layering.midLayerId,
    layering.outerLayerId,
    layering.neckwearId,
  ].filter(Boolean).length;
  return count >= 2;
}

export { isBeltItem };
