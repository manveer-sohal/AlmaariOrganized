/**
 * Validate / normalize layering wear states on recommendation payloads.
 */
import { logInfo } from "../../../observability/logger.js";
import { resolveGarmentOpenability } from "./garmentOpenabilityResolver.js";
import { normalizeWearStateMap } from "./wearStateResolver.js";

/**
 * Sanitize layering.wearState on a recommendation using wardrobe items.
 * Illegal "open" values are normalized to "standard" (outfit kept).
 */
export const sanitizeRecommendationLayering = ({
  recommendation,
  itemsById,
  generationId = null,
}) => {
  if (!recommendation?.layering?.wearState) {
    return recommendation;
  }

  const { wearState, corrected } = normalizeWearStateMap({
    wearState: recommendation.layering.wearState,
    itemsById,
    generationId,
  });

  for (const fix of corrected) {
    logInfo("stylist.layering.invalid_open_state", {
      workflow: "outfit_recommendation",
      generationId,
      ...fix,
    });
  }

  return {
    ...recommendation,
    layering: {
      ...recommendation.layering,
      wearState,
    },
  };
};

/**
 * Reject layering that marks a non-openable item open (strict mode).
 * @returns {{ ok: boolean, reason?: string }}
 */
export const assertWearStatesValid = (layering, itemsById) => {
  if (!layering?.wearState) return { ok: true };
  for (const [id, state] of Object.entries(layering.wearState)) {
    if (state !== "open") continue;
    const item = itemsById.get(String(id));
    if (!item) continue;
    const openability = resolveGarmentOpenability(item);
    if (!openability.canWearOpen) {
      return {
        ok: false,
        reason: "non_openable_item_marked_open",
        itemId: id,
        itemType: item.type,
        normalizedSubtype: openability.subtype,
      };
    }
  }
  return { ok: true };
};
