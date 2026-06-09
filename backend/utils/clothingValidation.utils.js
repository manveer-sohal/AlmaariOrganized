import {
  COLOURS_LIST,
  FITS_LIST,
  MATERIALS_LIST,
  PATTERNS_LIST,
  SLOTS_LIST,
  TYPE_LIST,
} from "../constants/clothingMetadata.js";
import { mapTypeToSlot } from "./slot.utils.js";

const formatScalar = (value) => {
  if (value == null) return "";
  if (typeof value !== "string") return String(value).trim();
  return value.trim();
};

const normalizeColourArray = (value) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const cleaned = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed || !COLOURS_LIST.includes(trimmed)) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
  }
  return cleaned;
};

export const validateClothingUpdatePayload = ({
  type,
  colour,
  material,
  fit,
  pattern,
  slot,
}) => {
  const errors = [];
  const normalizedType = formatScalar(type);

  if (!TYPE_LIST.includes(normalizedType)) {
    errors.push("Invalid clothing type");
  }

  const normalizedColour = normalizeColourArray(colour);
  if (normalizedColour.length === 0) {
    errors.push("At least one valid colour is required");
  }

  const normalizedMaterial = formatScalar(material);
  if (!MATERIALS_LIST.includes(normalizedMaterial)) {
    errors.push("Invalid material");
  }

  const normalizedFit = formatScalar(fit);
  if (!FITS_LIST.includes(normalizedFit)) {
    errors.push("Invalid fit");
  }

  const normalizedPattern = formatScalar(pattern);
  if (!PATTERNS_LIST.includes(normalizedPattern)) {
    errors.push("Invalid pattern");
  }

  let normalizedSlot = formatScalar(slot).toLowerCase();
  if (!normalizedSlot) {
    normalizedSlot = mapTypeToSlot(normalizedType);
  }
  if (!SLOTS_LIST.includes(normalizedSlot)) {
    errors.push("Invalid slot");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      type: normalizedType,
      colour: normalizedColour,
      material: normalizedMaterial,
      fit: normalizedFit,
      pattern: normalizedPattern,
      slot: normalizedSlot,
    },
  };
};
