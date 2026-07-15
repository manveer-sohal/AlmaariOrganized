import { logInfo } from "../../../observability/logger.js";
import { itemId } from "./layerRoles.js";

const TYPE = (item) => String(item?.type || "").toLowerCase().trim();
const NAME = (item) =>
  String(item?.name || item?.garmentName || "").toLowerCase().trim();

/**
 * Detect belts from type/name (legacy accessories included).
 */
export const isBeltType = (item) => {
  if (!item) return false;
  const hay = `${TYPE(item)} ${NAME(item)}`;
  return /\bbelt\b/.test(hay);
};

/**
 * Logical outfit slot for belts.
 */
export const resolveAccessorySlot = (item) => {
  if (isBeltType(item)) return "waist_accessory";
  const t = TYPE(item);
  if (/^(tie|bow\s*tie)$|necktie|scarf|ascot/.test(t)) return "neckwear";
  return "accessory";
};

/**
 * Whether a bottom garment supports a belt.
 * Unknown bottoms default to false (do not auto-add belts).
 */
export const bottomSupportsBelt = (item) => {
  if (!item) return false;
  const t = TYPE(item);
  const hay = `${t} ${NAME(item)} ${String(item.fit || "").toLowerCase()} ${String(item.material || "").toLowerCase()}`;

  if (item.beltLoops === true || item.stylingMetadata?.beltLoops === true) {
    return true;
  }
  if (item.beltLoops === false || item.stylingMetadata?.beltLoops === false) {
    return false;
  }

  if (
    /jogger|sweatpant|sweat\s*pant|legging|yoga|swim|boardshort|drawstring|elastic/.test(
      hay,
    )
  ) {
    return false;
  }

  if (
    /jeans|trouser|chino|dress\s*pant|slacks|corduroy|khaki|cargo|skirt/.test(
      hay,
    )
  ) {
    return true;
  }

  if (/\bshorts?\b/.test(hay) && !/swim|board|athletic|gym/.test(hay)) {
    return true;
  }

  return false;
};

/**
 * Soft score for belt pairing in [0, 1].
 */
export const scoreBeltCompatibility = ({
  belt,
  bottom,
  shoes = null,
  preferences = {},
}) => {
  if (!belt || !bottom) {
    return { total: 0, compatible: false, reason: "missing_items" };
  }

  const supports = bottomSupportsBelt(bottom);
  logInfo("stylist.belt.compatibility_checked", {
    workflow: "outfit_recommendation",
    beltItemId: itemId(belt),
    bottomItemId: itemId(bottom),
    compatibilityResult: supports,
    reason: supports ? "supports_belt" : "bottom_rejects_belt",
  });

  if (!supports) {
    return {
      total: 0,
      compatible: false,
      bottomCompatibility: 0,
      formality: 0,
      colorCoord: 0,
      occasion: 0,
      reason: "bottom_rejects_belt",
    };
  }

  let bottomCompatibility = 0.9;
  let formality = 0.7;
  let colorCoord = 0.65;
  let occasionFit = 0.7;

  const beltColour = flattenColour(belt);
  const shoeColour = flattenColour(shoes);
  if (beltColour && shoeColour && beltColour === shoeColour) {
    colorCoord = 0.95;
  }

  const occasion = preferences.occasion || "Everyday";
  const beltType = TYPE(belt);
  if (/Formal|Work|Dinner/.test(occasion)) {
    if (/dress|leather|black|brown/.test(beltType + " " + beltColour)) {
      formality = 0.92;
      occasionFit = 0.9;
    }
    if (/woven|bright|canvas|web/.test(beltType)) {
      formality = 0.35;
      occasionFit = 0.4;
    }
  } else if (occasion === "Everyday" || preferences.style === "Casual") {
    occasionFit = 0.85;
  }

  const total =
    bottomCompatibility * 0.35 +
    formality * 0.2 +
    colorCoord * 0.25 +
    occasionFit * 0.2;

  return {
    total,
    compatible: true,
    bottomCompatibility,
    formality,
    colorCoord,
    occasion: occasionFit,
    reason: "compatible",
  };
};

const flattenColour = (item) => {
  if (!item) return "";
  const c = item.colour;
  const raw = Array.isArray(c) ? c[0] : c;
  return String(raw || "").toLowerCase().trim();
};

export const BELT_POOL = 4;
