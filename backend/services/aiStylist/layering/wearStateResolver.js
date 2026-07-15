import { logInfo } from "../../../observability/logger.js";
import { resolveGarmentOpenability } from "./garmentOpenabilityResolver.js";
import { resolveTopSubtype } from "./topSubtypeResolver.js";

const itemId = (item) =>
  item?._id?.toString?.() || String(item?._id || item?.id || "");

const isTieType = (item) => {
  const t = String(item?.type || "").toLowerCase().trim();
  return /^(tie|bow\s*tie)$|necktie|bowtie/.test(t);
};

/**
 * Derive wear state from role + garment capability.
 * Never returns "open" when canWearOpen is false.
 *
 * @returns {"open"|"closed"|"standard"}
 */
export const resolveWearState = ({
  item,
  assignedRole,
  hasBaseLayerUnderneath = false,
  hasTie = false,
  occasion = null,
  generationId = null,
  log = false,
}) => {
  const openability = resolveGarmentOpenability(item, { generationId, log });
  const subtype = openability.subtype || resolveTopSubtype(item);
  let wearState = "standard";

  if (!openability.canWearOpen) {
    wearState = "standard";
  } else if (hasTie && (assignedRole === "base_top" || assignedRole === "mid_layer")) {
    wearState = "closed";
  } else if (assignedRole === "base_top") {
    if (subtype === "dress_shirt" || hasTie) {
      wearState = "closed";
    } else if (
      /Formal|Work|Dinner/.test(String(occasion || "")) &&
      (subtype === "button_up" || subtype === "dress_shirt")
    ) {
      wearState = "closed";
    } else {
      wearState = "standard";
    }
  } else if (assignedRole === "mid_layer") {
    if (hasBaseLayerUnderneath && openability.canWearOpen) {
      wearState = "open";
    } else {
      wearState = "standard";
    }
  } else if (assignedRole === "outer_layer") {
    wearState = "standard";
  } else {
    wearState = "standard";
  }

  // Hard guard
  if (wearState === "open" && !openability.canWearOpen) {
    logInfo("stylist.layering.invalid_open_state", {
      workflow: "outfit_recommendation",
      generationId,
      itemId: itemId(item),
      rawType: item?.type || null,
      normalizedSubtype: subtype,
      assignedRole,
      reason: "non_openable_forced_standard",
    });
    wearState = "standard";
  }

  if (log) {
    logInfo("stylist.layering.wear_state_resolved", {
      workflow: "outfit_recommendation",
      generationId,
      itemId: itemId(item),
      rawType: item?.type || null,
      normalizedSubtype: subtype,
      canWearOpen: openability.canWearOpen,
      assignedRole,
      wearState,
    });
  }

  return wearState;
};

/**
 * Normalize a wearState map: force any illegal "open" to "standard".
 * @returns {{ wearState: Record<string,string>, corrected: Array<object> }}
 */
export const normalizeWearStateMap = ({
  wearState = {},
  itemsById = new Map(),
  generationId = null,
}) => {
  const next = { ...wearState };
  const corrected = [];

  for (const [id, state] of Object.entries(next)) {
    if (state !== "open") continue;
    const item = itemsById.get(String(id));
    if (!item) {
      next[id] = "standard";
      corrected.push({ itemId: id, reason: "missing_item" });
      continue;
    }
    const openability = resolveGarmentOpenability(item, { generationId });
    if (!openability.canWearOpen) {
      next[id] = "standard";
      corrected.push({
        itemId: id,
        itemType: item.type,
        normalizedSubtype: openability.subtype,
        reason: "non_openable_item_marked_open",
      });
      logInfo("stylist.validation_failed", {
        workflow: "outfit_recommendation",
        generationId,
        reason: "non_openable_item_marked_open",
        itemId: id,
        itemType: item.type,
        normalizedSubtype: openability.subtype,
      });
    }
  }

  return { wearState: next, corrected };
};

export { isTieType };
