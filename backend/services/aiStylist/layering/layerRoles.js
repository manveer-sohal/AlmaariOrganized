/**
 * Derive layer roles and layering metadata from existing clothing types.
 * No DB migration — purely derived / optional overlay.
 */

import { resolveTopSubtype } from "./topSubtypeResolver.js";
import { resolveGarmentOpenability } from "./garmentOpenabilityResolver.js";

export const LAYER_ROLES = [
  "base_top",
  "mid_layer",
  "outer_layer",
  "neckwear",
  "waist_accessory",
  "none",
];

const TYPE = (item) => String(item?.type || "").toLowerCase().trim();

/** Collared shirts that can take a tie when worn closed as base. */
export const isCollaredShirt = (item) => {
  const subtype = resolveTopSubtype(item);
  if (
    ["dress_shirt", "button_up", "polo", "blouse"].includes(subtype)
  ) {
    return true;
  }
  // Generic "Shirt" is often collared enough for a tie, but not openable
  if (subtype === "other_top" && /^shirt$/.test(TYPE(item))) return true;
  return false;
};

export const isBaseTopType = (item) => {
  const subtype = resolveTopSubtype(item);
  return [
    "t_shirt",
    "tank_top",
    "polo",
    "blouse",
    "dress_shirt",
    "button_up",
    "flannel",
    "overshirt",
    "other_top",
  ].includes(subtype);
};

/** Pullover-style mids that layer over a base without opening. */
export const isPulloverMidType = (item) => {
  const subtype = resolveTopSubtype(item);
  if (["sweater", "hoodie", "vest"].includes(subtype)) {
    const openability = resolveGarmentOpenability(item);
    // Zip hoodie is openable mid; pullover hoodie is pullover mid
    if (subtype === "hoodie" && openability.canWearOpen) return false;
    return true;
  }
  return false;
};

/** Openable mid layers (button-front / cardigan / overshirt). */
export const isOpenableMidType = (item) => {
  const openability = resolveGarmentOpenability(item);
  const subtype = resolveTopSubtype(item);
  return (
    openability.canWearOpen &&
    ["button_up", "overshirt", "flannel", "cardigan", "vest", "dress_shirt"].includes(
      subtype,
    )
  );
};

export const isMidLayerType = (item) =>
  isPulloverMidType(item) || isOpenableMidType(item);

export const isOuterLayerType = (item) => {
  const t = TYPE(item);
  return /jacket|coat|blazer|parka|trench|bomber|windbreaker|raincoat|overcoat/.test(
    t,
  );
};

export const isNeckwearType = (item) => {
  const t = TYPE(item);
  return /^(tie|bow\s*tie)$|necktie|scarf|ascot/.test(t);
};

export const isTieType = (item) => {
  const t = TYPE(item);
  return /^(tie|bow\s*tie)$|necktie|bowtie/.test(t);
};

export const isDress = (item) => {
  const t = String(item?.type || "")
    .toLowerCase()
    .trim();
  if (/dress\s*shirt/.test(t)) return false;
  return /\bdress\b/.test(t);
};

export const resolveBulkLevel = (item) => {
  const t = TYPE(item);
  if (/coat|parka|puffer|overcoat|trench|heavy/.test(t)) return "heavy";
  if (/hoodie|sweater|fleece|blazer|jacket|cardigan|vest/.test(t))
    return "medium";
  return "light";
};

/**
 * Possible layer roles an item can play (ordered preferred → alternate).
 * Generic non-button "Shirt" is base_top only — never an open mid layer.
 */
export const resolveLayerRoles = (item) => {
  if (!item) return ["none"];

  const slot = String(item.slot || "")
    .trim()
    .toLowerCase();

  // Non-upper slots never become layer roles via top-subtype heuristics
  if (slot === "legs" || slot === "feet") return ["none"];

  if (isDress(item)) return ["none"];
  if (isNeckwearType(item)) return ["neckwear"];
  if (isOuterLayerType(item)) return ["outer_layer"];

  const subtype = resolveTopSubtype(item);

  if (subtype === "overshirt" || subtype === "flannel") {
    return ["mid_layer", "base_top"];
  }
  if (subtype === "button_up") {
    return ["mid_layer", "base_top"];
  }
  if (subtype === "cardigan" || subtype === "vest") {
    return ["mid_layer"];
  }
  if (subtype === "sweater" || subtype === "hoodie") {
    return ["mid_layer"];
  }
  if (subtype === "dress_shirt") {
    return ["base_top"];
  }
  if (
    subtype === "t_shirt" ||
    subtype === "tank_top" ||
    subtype === "polo" ||
    subtype === "blouse" ||
    subtype === "other_top"
  ) {
    // Generic / non-openable tops are base only — and only for body-slot items
    if (slot && slot !== "body" && slot !== "head") return ["none"];
    return ["base_top"];
  }

  if (isOpenableMidType(item)) return ["mid_layer", "base_top"];
  if (isPulloverMidType(item)) return ["mid_layer"];
  if (isBaseTopType(item)) return ["base_top"];

  if (slot === "body") return ["base_top"];
  if (slot === "head" && !isNeckwearType(item)) return ["none"];
  return ["none"];
};

export const getLayeringMetadata = (item) => {
  const roles = resolveLayerRoles(item);
  const openability = resolveGarmentOpenability(item);
  const subtype = openability.subtype || resolveTopSubtype(item);

  return {
    layerRoles: roles,
    canWearOpen: openability.canWearOpen,
    canWearClosed: openability.canWearClosed,
    openabilitySource: openability.openabilitySource,
    topSubtype: subtype,
    supportsTie: isCollaredShirt(item),
    bulkLevel: resolveBulkLevel(item),
    isCollared: isCollaredShirt(item),
    isTie: isTieType(item),
    isDress: isDress(item),
  };
};

export const itemId = (item) =>
  item?._id?.toString?.() || String(item?._id || item?.id || "");
