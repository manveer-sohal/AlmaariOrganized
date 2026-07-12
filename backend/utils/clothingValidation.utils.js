import {
  COLOURS_LIST,
  FITS_LIST,
  MATERIALS_LIST,
  OCCASION_TAGS,
  PATTERNS_LIST,
  SLOTS_LIST,
  STYLE_CATEGORIES,
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
  slot: _slot,
  styleCategory,
  occasionTags,
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

  // Always derive slot from type so mismatches (e.g. Belt → body) cannot persist.
  let normalizedSlot = mapTypeToSlot(normalizedType);
  if (!SLOTS_LIST.includes(normalizedSlot)) {
    errors.push("Invalid slot");
  }

  const data = {
    type: normalizedType,
    colour: normalizedColour,
    material: normalizedMaterial,
    fit: normalizedFit,
    pattern: normalizedPattern,
    slot: normalizedSlot,
  };

  if (styleCategory !== undefined) {
    if (styleCategory === null || styleCategory === "") {
      data.styleCategory = null;
    } else if (STYLE_CATEGORIES.includes(styleCategory)) {
      data.styleCategory = styleCategory;
    } else {
      errors.push("Invalid styleCategory");
    }
  }

  if (occasionTags !== undefined) {
    if (!Array.isArray(occasionTags)) {
      errors.push("occasionTags must be an array");
    } else {
      const cleaned = [];
      const seen = new Set();
      for (const tag of occasionTags) {
        if (!OCCASION_TAGS.includes(tag)) {
          errors.push(`Invalid occasionTag: ${tag}`);
          break;
        }
        if (seen.has(tag)) continue;
        seen.add(tag);
        cleaned.push(tag);
      }
      data.occasionTags = cleaned;
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data };
};
