const TAG_FIELDS = ["type", "colour", "material", "fit", "pattern"];

const isValidConfidence = (confidence) =>
  typeof confidence === "number" &&
  !Number.isNaN(confidence) &&
  confidence >= 0 &&
  confidence <= 1;

export const isValidScalarTag = (tag) => {
  if (!tag || typeof tag !== "object") return false;
  const { value, confidence } = tag;
  if (value == null || typeof value !== "string" || !value.trim()) {
    return false;
  }
  return isValidConfidence(confidence);
};

export const isValidColourTag = (tag) => {
  if (!tag || typeof tag !== "object") return false;
  const { value, confidence } = tag;
  if (!Array.isArray(value) || value.length === 0) return false;
  if (!value.every((item) => typeof item === "string" && item.trim())) {
    return false;
  }
  return isValidConfidence(confidence);
};

/** @deprecated use isValidScalarTag or isValidColourTag */
export const isValidTag = (tag) => isValidScalarTag(tag);

export const countValidTags = (tags) => {
  if (!tags || typeof tags !== "object") return 0;
  return TAG_FIELDS.reduce((count, field) => {
    if (field === "colour") {
      return count + (isValidColourTag(tags[field]) ? 1 : 0);
    }
    return count + (isValidScalarTag(tags[field]) ? 1 : 0);
  }, 0);
};

const sanitizeScalarTag = (tag) => {
  if (!tag || typeof tag !== "object") {
    return { value: null, confidence: 0 };
  }
  const value =
    tag.value != null && typeof tag.value === "string"
      ? tag.value.trim()
      : null;
  const confidence =
    typeof tag.confidence === "number" && !Number.isNaN(tag.confidence)
      ? Math.max(0, Math.min(1, tag.confidence))
      : 0;
  return {
    value: value || null,
    confidence,
  };
};

const sanitizeColourTag = (tag) => {
  if (!tag || typeof tag !== "object") {
    return { value: null, confidence: 0 };
  }

  let values = tag.value;
  if (typeof values === "string" && values.trim()) {
    values = [values.trim()];
  }

  const confidence =
    typeof tag.confidence === "number" && !Number.isNaN(tag.confidence)
      ? Math.max(0, Math.min(1, tag.confidence))
      : 0;

  if (!Array.isArray(values)) {
    return { value: null, confidence };
  }

  const seen = new Set();
  const cleaned = [];
  for (const item of values) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(trimmed);
    if (cleaned.length >= 3) break;
  }

  return {
    value: cleaned.length > 0 ? cleaned : null,
    confidence,
  };
};

export const sanitizeTagsPayload = (rawTags) => {
  const tags = {};
  for (const field of TAG_FIELDS) {
    if (field === "colour") {
      tags[field] = sanitizeColourTag(rawTags?.[field]);
    } else {
      tags[field] = sanitizeScalarTag(rawTags?.[field]);
    }
  }
  return tags;
};

export { TAG_FIELDS };
