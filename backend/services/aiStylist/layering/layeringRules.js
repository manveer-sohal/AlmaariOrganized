import {
  getLayeringMetadata,
  isOuterLayerType,
  isTieType,
  itemId,
} from "./layerRoles.js";
import { logInfo } from "../../../observability/logger.js";
import { resolveWearState } from "./wearStateResolver.js";
import { resolveTopSubtype } from "./topSubtypeResolver.js";

/**
 * Configurable layering compatibility rules.
 */
export const LAYERING_RULES = {
  maxOuterLayers: 1,
  maxMidLayers: 1,
  maxBaseTops: 1,
  maxNeckwear: 1,
  invalidBulkPairs: [
    ["heavy", "heavy"],
    ["heavy", "medium"],
  ],
  rejectHoodieUnderFittedBlazer: true,
  rejectTieWithoutCollar: true,
  rejectTieWithTee: true,
  rejectTwoHeavyMids: true,
  /** Non-openable tops cannot be mid over a base (except pullover mids). */
  rejectNonOpenableShirtAsOpenMid: true,
};

const bulkRank = { light: 1, medium: 2, heavy: 3 };

const isPulloverMid = (item) => {
  const subtype = resolveTopSubtype(item);
  const meta = getLayeringMetadata(item);
  return (
    (["sweater", "hoodie", "vest"].includes(subtype) && !meta.canWearOpen) ||
    (subtype === "hoodie" && !meta.canWearOpen)
  );
};

/**
 * Validate a layered upper-body assignment.
 * @returns {{ ok: boolean, reason?: string, wearState: Record<string,string> }}
 */
export const validateLayerCombination = ({
  baseTop,
  midLayer,
  outerLayer,
  neckwear,
  dress = null,
  preferences = {},
  generationId = null,
}) => {
  const wearState = {};
  const meta = {
    base: baseTop ? getLayeringMetadata(baseTop) : null,
    mid: midLayer ? getLayeringMetadata(midLayer) : null,
    outer: outerLayer ? getLayeringMetadata(outerLayer) : null,
    neck: neckwear ? getLayeringMetadata(neckwear) : null,
  };

  if (dress) {
    if (neckwear) wearState[itemId(neckwear)] = "standard";
    wearState[itemId(dress)] = "standard";
    return { ok: true, wearState };
  }

  if (!baseTop && !midLayer && !outerLayer) {
    return { ok: false, reason: "empty_upper_body", wearState };
  }

  // Mid / outer layers require a base top (default — no jacket-only / sweater-only)
  if ((midLayer || outerLayer) && !baseTop) {
    logInfo("stylist.layering.base_required", {
      workflow: "outfit_recommendation",
      generationId,
      reason: "missing_base_top",
      hasMid: Boolean(midLayer),
      hasOuter: Boolean(outerLayer),
    });
    return { ok: false, reason: "missing_base_top", wearState };
  }

  // Jackets / coats must not be treated as base
  if (baseTop && isOuterLayerType(baseTop)) {
    return { ok: false, reason: "outerwear_as_base", wearState };
  }

  const hasTie = Boolean(neckwear && isTieType(neckwear));

  // Tie rules
  if (hasTie) {
    if (!baseTop) {
      return { ok: false, reason: "tie_without_base", wearState };
    }
    if (!meta.base?.isCollared) {
      return { ok: false, reason: "tie_without_collared_shirt", wearState };
    }
    const baseSubtype = meta.base.topSubtype;
    if (["t_shirt", "tank_top", "hoodie"].includes(baseSubtype)) {
      return { ok: false, reason: "tie_with_tee", wearState };
    }
  }

  // Non-openable generic shirts cannot sit as mid over a base
  if (baseTop && midLayer) {
    const midSubtype = meta.mid?.topSubtype;
    if (
      LAYERING_RULES.rejectNonOpenableShirtAsOpenMid &&
      !meta.mid?.canWearOpen &&
      !isPulloverMid(midLayer) &&
      [
        "other_top",
        "polo",
        "t_shirt",
        "tank_top",
        "blouse",
        "dress_shirt",
      ].includes(midSubtype)
    ) {
      return { ok: false, reason: "non_openable_mid_over_base", wearState };
    }
  }

  // Hoodie under fitted blazer
  if (midLayer && outerLayer && LAYERING_RULES.rejectHoodieUnderFittedBlazer) {
    const outerType = String(outerLayer.type || "").toLowerCase();
    const midType = String(midLayer.type || "").toLowerCase();
    if (/hoodie/.test(midType) && /blazer/.test(outerType)) {
      return { ok: false, reason: "hoodie_under_blazer", wearState };
    }
  }

  if (midLayer && meta.mid?.bulkLevel === "heavy" && outerLayer) {
    const outerType = String(outerLayer.type || "").toLowerCase();
    if (
      bulkRank[meta.mid.bulkLevel] >= 2 &&
      bulkRank[meta.outer?.bulkLevel] >= 2 &&
      /fitted|slim|blazer/.test(outerType)
    ) {
      return { ok: false, reason: "bulk_clash", wearState };
    }
  }

  if (
    midLayer &&
    outerLayer &&
    meta.mid?.bulkLevel === "heavy" &&
    meta.outer?.bulkLevel === "heavy"
  ) {
    return { ok: false, reason: "two_heavy_layers", wearState };
  }

  const ids = [baseTop, midLayer, outerLayer, neckwear]
    .filter(Boolean)
    .map(itemId);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, reason: "duplicate_item", wearState };
  }

  // Wear state from central resolver
  if (baseTop) {
    wearState[itemId(baseTop)] = resolveWearState({
      item: baseTop,
      assignedRole: "base_top",
      hasBaseLayerUnderneath: false,
      hasTie,
      occasion: preferences.occasion,
      generationId,
    });
  }
  if (midLayer) {
    wearState[itemId(midLayer)] = resolveWearState({
      item: midLayer,
      assignedRole: "mid_layer",
      hasBaseLayerUnderneath: Boolean(baseTop),
      hasTie,
      occasion: preferences.occasion,
      generationId,
    });
  }
  if (outerLayer) {
    wearState[itemId(outerLayer)] = resolveWearState({
      item: outerLayer,
      assignedRole: "outer_layer",
      hasBaseLayerUnderneath: Boolean(baseTop || midLayer),
      hasTie: false,
      occasion: preferences.occasion,
      generationId,
    });
  }
  if (neckwear) {
    wearState[itemId(neckwear)] = "standard";
  }

  // Final guard: never allow open on non-openable
  for (const [piece, role] of [
    [baseTop, "base"],
    [midLayer, "mid"],
    [outerLayer, "outer"],
  ]) {
    if (!piece) continue;
    const id = itemId(piece);
    if (wearState[id] === "open" && !getLayeringMetadata(piece).canWearOpen) {
      return {
        ok: false,
        reason: "non_openable_item_marked_open",
        wearState,
      };
    }
    void role;
  }

  const weather = preferences.weather || "Mild";
  if (weather === "Warm" && outerLayer && meta.outer?.bulkLevel === "heavy") {
    return { ok: false, reason: "heavy_outer_in_warm_weather", wearState };
  }

  return { ok: true, wearState };
};

/**
 * Soft score for layering quality in [0, 1].
 */
export const scoreLayerCombination = ({
  baseTop,
  midLayer,
  outerLayer,
  neckwear,
  dress = null,
  preferences = {},
  generationId = null,
}) => {
  const validation = validateLayerCombination({
    baseTop,
    midLayer,
    outerLayer,
    neckwear,
    dress,
    preferences,
    generationId,
  });
  if (!validation.ok) {
    return {
      compatibility: 0,
      bulkBalance: 0,
      weatherFit: 0,
      occasionFit: 0,
      neckwearFit: 0,
      total: 0,
      rejected: true,
      reason: validation.reason,
    };
  }

  const weather = preferences.weather || "Mild";
  const occasion = preferences.occasion || "Everyday";
  const style = preferences.style || "Casual";

  let compatibility = 0.75;
  let bulkBalance = 0.8;
  let weatherFit = 0.7;
  let occasionFit = 0.7;
  let neckwearFit = neckwear ? 0.9 : 0.75;

  const layerCount = [baseTop, midLayer, outerLayer].filter(Boolean).length;

  if (weather === "Cold") {
    weatherFit = layerCount >= 2 ? 0.95 : layerCount === 1 ? 0.55 : 0.3;
  } else if (weather === "Warm") {
    weatherFit = layerCount <= 1 ? 0.95 : layerCount === 2 ? 0.65 : 0.35;
  } else {
    weatherFit = layerCount <= 2 ? 0.85 : 0.6;
  }

  if (/Formal|Work|Dinner/.test(occasion)) {
    if (neckwear && baseTop) occasionFit = 0.95;
    else if (
      outerLayer &&
      /blazer|jacket/.test(String(outerLayer.type || "").toLowerCase())
    )
      occasionFit = 0.88;
    else occasionFit = 0.65;
  } else if (occasion === "Everyday" || style === "Casual") {
    occasionFit = layerCount <= 2 ? 0.9 : 0.7;
    if (neckwear && isTieType(neckwear)) occasionFit *= 0.7;
  }

  if (midLayer && baseTop) compatibility = 0.92;
  if (outerLayer && (baseTop || midLayer))
    compatibility = Math.max(compatibility, 0.88);

  const midMeta = midLayer ? getLayeringMetadata(midLayer) : null;
  const outerMeta = outerLayer ? getLayeringMetadata(outerLayer) : null;
  if (midMeta && outerMeta) {
    const gap = Math.abs(
      (bulkRank[midMeta.bulkLevel] || 1) - (bulkRank[outerMeta.bulkLevel] || 1),
    );
    bulkBalance = gap <= 1 ? 0.9 : 0.45;
  }

  const total =
    compatibility * 0.3 +
    bulkBalance * 0.2 +
    weatherFit * 0.2 +
    occasionFit * 0.2 +
    neckwearFit * 0.1;

  return {
    compatibility,
    bulkBalance,
    weatherFit,
    occasionFit,
    neckwearFit,
    total,
    rejected: false,
    wearState: validation.wearState,
  };
};
