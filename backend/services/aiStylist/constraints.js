import { resolveSlots } from "./slotResolver.js";

/**
 * Build hard outfit constraints from resolved mode + wardrobe items.
 */
export const buildConstraints = ({
  mode,
  requiredItemIds,
  requiredItems,
  preferences = {},
  excludedItemIds = [],
}) => {
  const slotInfo = resolveSlots({ requiredItems, mode });

  return {
    mode,
    requiredItemIds: new Set(requiredItemIds.map(String)),
    requiredItems,
    requiredBySlot: slotInfo.requiredBySlot,
    requiredSlots: slotInfo.occupiedSlots,
    missingSlots: slotInfo.missingSlots,
    optionalSlots: slotInfo.optionalSlots,
    fillSlots: slotInfo.fillSlots,
    dressPath: slotInfo.dressPath,
    excludedItemIds: new Set(excludedItemIds.map(String)),
    occasion: preferences.occasion ?? null,
    season: preferences.season ?? null,
    weather: preferences.weather ?? null,
    style: preferences.style ?? null,
    avoid: preferences.avoid ?? "",
    refinementPrompt: preferences.refinementPrompt || "",
    conflicts: slotInfo.conflicts,
  };
};
