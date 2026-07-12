import {
  FITS_LIST,
  OCCASION_TAGS,
  OUTFIT_ROLES,
  STYLE_CATEGORIES,
} from "../constants/clothingMetadata.js";
import {
  countValidTags,
  sanitizeTagsPayload,
} from "./tagValidation.utils.js";

const clampConfidence = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(1, value));
};

const pickEnum = (value, allowed) => {
  if (value == null) return null;
  const normalized =
    typeof value === "string" ? value.trim() : String(value).trim();
  if (!normalized) return null;
  const match = allowed.find(
    (item) => item.toLowerCase() === normalized.toLowerCase(),
  );
  return match || null;
};

const pickEnumList = (value, allowed) => {
  let values = value;
  if (typeof values === "string" && values.trim()) {
    values = [values.trim()];
  }
  if (!Array.isArray(values)) return [];

  const seen = new Set();
  const cleaned = [];
  for (const item of values) {
    const match = pickEnum(item, allowed);
    if (!match) continue;
    const key = match.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(match);
  }
  return cleaned;
};

const readField = (raw, key) => {
  const field = raw?.[key];
  if (field == null) return { value: null, confidence: null };
  if (typeof field !== "object" || Array.isArray(field)) {
    return { value: field, confidence: null };
  }
  return {
    value: field.value ?? null,
    confidence: clampConfidence(field.confidence),
  };
};

const clampInt = (value, min, max) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  const rounded = Math.round(value);
  if (rounded < min || rounded > max) return null;
  return rounded;
};

/** True when the analysis includes at least one rich styling field. */
export const hasRichStylingFields = (styling) => {
  if (!styling || typeof styling !== "object") return false;
  if (styling.styleCategory != null) return true;
  if (Array.isArray(styling.occasionTags) && styling.occasionTags.length > 0) {
    return true;
  }
  if (styling.formalityScore != null) return true;
  if (styling.statementLevel != null) return true;
  if (styling.outfitRole != null) return true;
  return false;
};

/**
 * When the user sets styleCategory, keep formalityScore inside a matching band.
 * Simpler than ignoring AI formality only at stylist time — keeps stored data coherent.
 */
export const FORMALITY_BAND_BY_CATEGORY = {
  Casual: { min: 1, max: 4, default: 3 },
  "Smart Casual": { min: 4, max: 7, default: 5 },
  Formal: { min: 7, max: 10, default: 8 },
  Athletic: { min: 1, max: 4, default: 2 },
};

export const clampFormalityToStyleCategory = (styleCategory, formalityScore) => {
  const band = FORMALITY_BAND_BY_CATEGORY[styleCategory];
  if (!band) return formalityScore ?? null;
  if (formalityScore == null || Number.isNaN(Number(formalityScore))) {
    return band.default;
  }
  const score = Math.round(Number(formalityScore));
  return Math.min(band.max, Math.max(band.min, score));
};

/**
 * Effective formality for stylist scoring.
 * User-reviewed styleCategory takes precedence over AI formalityScore.
 */
export const effectiveFormalityScore = (item) => {
  const meta = item?.stylingMetadata || {};
  if (meta.styleCategorySource === "user" && meta.styleCategory) {
    return clampFormalityToStyleCategory(
      meta.styleCategory,
      meta.formalityScore,
    );
  }
  if (typeof meta.formalityScore === "number") return meta.formalityScore;
  return null;
};

/**
 * Normalizes FastAPI analyze-clothing responses into a stable shape.
 * Accepts legacy { value, confidence } core fields and optional rich styling fields.
 * Invalid enums / out-of-range scores become null (or []) — never throw.
 */
export const normalizeClothingAnalysisResponse = (rawResponse) => {
  const raw = rawResponse && typeof rawResponse === "object" ? rawResponse : {};
  const core = sanitizeTagsPayload(raw);
  const validTagCount = countValidTags(core);

  const styleCategoryField = readField(raw, "styleCategory");
  const occasionTagsField = readField(raw, "occasionTags");
  const formalityField = readField(raw, "formalityScore");
  const statementField = readField(raw, "statementLevel");
  const outfitRoleField = readField(raw, "outfitRole");

  if (core.fit?.value && !FITS_LIST.includes(core.fit.value)) {
    core.fit = { value: null, confidence: core.fit.confidence ?? 0 };
  }

  const styling = {
    styleCategory: pickEnum(styleCategoryField.value, STYLE_CATEGORIES),
    occasionTags: pickEnumList(occasionTagsField.value, OCCASION_TAGS),
    formalityScore: clampInt(formalityField.value, 1, 10),
    statementLevel: clampInt(statementField.value, 1, 5),
    outfitRole: pickEnum(outfitRoleField.value, OUTFIT_ROLES),
    confidence: {
      type: clampConfidence(core.type?.confidence) ?? null,
      colour: clampConfidence(core.colour?.confidence) ?? null,
      material: clampConfidence(core.material?.confidence) ?? null,
      fit: clampConfidence(core.fit?.confidence) ?? null,
      pattern: clampConfidence(core.pattern?.confidence) ?? null,
      styleCategory: styleCategoryField.confidence,
      occasionTags: occasionTagsField.confidence,
      formalityScore: formalityField.confidence,
      statementLevel: statementField.confidence,
      outfitRole: outfitRoleField.confidence,
    },
  };

  return {
    core,
    validTagCount,
    styling,
    hasRichStyling: hasRichStylingFields(styling),
  };
};

export const emptyConfidence = () => ({
  type: null,
  colour: null,
  material: null,
  fit: null,
  pattern: null,
  styleCategory: null,
  occasionTags: null,
  formalityScore: null,
  statementLevel: null,
  outfitRole: null,
});

export const defaultStylingMetadata = () => ({
  styleCategory: null,
  occasionTags: [],
  formalityScore: null,
  statementLevel: null,
  outfitRole: null,
  confidence: emptyConfidence(),
  styleCategorySource: null,
  occasionTagsSource: null,
  enrichmentStatus: "pending",
  enrichmentError: null,
  enrichedAt: null,
  processingStartedAt: null,
  lastRetryAt: null,
  enrichmentAttemptCount: 0,
  userReviewedAt: null,
});
