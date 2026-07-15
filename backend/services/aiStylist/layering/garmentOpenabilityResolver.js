import { logInfo } from "../../../observability/logger.js";
import {
  metadataHaystack,
  resolveTopSubtype,
} from "./topSubtypeResolver.js";

const itemId = (item) =>
  item?._id?.toString?.() || String(item?._id || item?.id || "");

/** Subtypes that are explicitly front-openable by construction. */
const OPENABLE_BY_SUBTYPE = new Set([
  "button_up",
  "dress_shirt",
  "overshirt",
  "flannel",
  "cardigan",
  "vest",
]);

/**
 * Resolve whether a garment can physically be worn open.
 * Ambiguous / generic "Shirt" defaults to canWearOpen = false.
 *
 * @returns {{
 *   canWearOpen: boolean,
 *   canWearClosed: boolean,
 *   openabilitySource: "explicit_metadata"|"normalized_subtype"|"heuristic"|"default",
 *   subtype: string,
 * }}
 */
export const resolveGarmentOpenability = (
  item,
  { generationId = null, log = false } = {},
) => {
  const subtype = resolveTopSubtype(item);
  const hay = metadataHaystack(item);

  // Explicit closure metadata wins
  if (item?.closure || item?.stylingMetadata?.closure) {
    const closure = String(
      item.closure || item.stylingMetadata?.closure || "",
    ).toLowerCase();
    if (/button|zip|snap|open.?front/.test(closure)) {
      const result = {
        canWearOpen: true,
        canWearClosed: true,
        openabilitySource: "explicit_metadata",
        subtype,
      };
      maybeLogOpenability(item, result, generationId, log);
      return result;
    }
    if (/pullover|none|sealed|fixed/.test(closure)) {
      const result = {
        canWearOpen: false,
        canWearClosed: true,
        openabilitySource: "explicit_metadata",
        subtype,
      };
      maybeLogOpenability(item, result, generationId, log);
      return result;
    }
  }

  if (OPENABLE_BY_SUBTYPE.has(subtype)) {
    const result = {
      canWearOpen: true,
      canWearClosed: true,
      openabilitySource: "normalized_subtype",
      subtype,
    };
    maybeLogOpenability(item, result, generationId, log);
    return result;
  }

  // Zip hoodie / zip jacket heuristics
  if (subtype === "hoodie" && /zip|zipper|open.?front/.test(hay)) {
    const result = {
      canWearOpen: true,
      canWearClosed: true,
      openabilitySource: "heuristic",
      subtype,
    };
    maybeLogOpenability(item, result, generationId, log);
    return result;
  }

  const t = String(item?.type || "").toLowerCase();
  if (
    /jacket|blazer|coat|bomber|parka|trench|windbreaker/.test(t) &&
    /zip|button|open/.test(hay)
  ) {
    const result = {
      canWearOpen: true,
      canWearClosed: true,
      openabilitySource: "heuristic",
      subtype,
    };
    maybeLogOpenability(item, result, generationId, log);
    return result;
  }

  // Outerwear generally can open, even without zip keyword
  if (/jacket|blazer|coat|bomber|parka|trench|windbreaker|raincoat/.test(t)) {
    const result = {
      canWearOpen: true,
      canWearClosed: true,
      openabilitySource: "heuristic",
      subtype,
    };
    maybeLogOpenability(item, result, generationId, log);
    return result;
  }

  // Default: not openable (includes generic Shirt, tee, polo, sweater, pullover hoodie)
  const result = {
    canWearOpen: false,
    canWearClosed: true,
    openabilitySource: "default",
    subtype,
  };
  maybeLogOpenability(item, result, generationId, log);
  return result;
};

const maybeLogOpenability = (item, result, generationId, log) => {
  if (!log) return;
  logInfo("stylist.layering.openability_resolved", {
    workflow: "outfit_recommendation",
    generationId,
    itemId: itemId(item),
    rawType: item?.type || null,
    normalizedSubtype: result.subtype,
    canWearOpen: result.canWearOpen,
    openabilitySource: result.openabilitySource,
  });
};
