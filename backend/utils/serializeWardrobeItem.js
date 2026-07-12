import { effectiveFormalityScore } from "./normalizeClothingAnalysisResponse.js";

/**
 * Compact wardrobe item for AI Stylist prompts and scoring.
 * User-reviewed styleCategory / occasionTags are labeled in the payload.
 * When styleCategory is user-sourced, formalityScore is category-aligned
 * via effectiveFormalityScore (AI formality is not trusted as-is).
 */
export const serializeWardrobeItemForStylist = (item) => {
  if (!item) return null;

  const meta = item.stylingMetadata || {};
  const serialized = {
    id: item._id?.toString?.() || String(item._id || item.id || ""),
    slot: item.slot,
    type: item.type,
    colours: Array.isArray(item.colour)
      ? item.colour
      : item.colour
        ? [item.colour]
        : [],
    material: item.material || null,
    fit: item.fit || null,
    pattern: item.pattern || null,
    seasons: Array.isArray(item.season) ? item.season : [],
  };

  if (meta.styleCategory) {
    serialized.styleCategory = meta.styleCategory;
    if (meta.styleCategorySource) {
      serialized.styleCategorySource = meta.styleCategorySource;
    }
  }
  if (Array.isArray(meta.occasionTags) && meta.occasionTags.length > 0) {
    serialized.occasionTags = meta.occasionTags;
    if (meta.occasionTagsSource) {
      serialized.occasionTagsSource = meta.occasionTagsSource;
    }
  }

  const formality = effectiveFormalityScore(item);
  if (formality != null) serialized.formalityScore = formality;
  if (meta.statementLevel != null) {
    serialized.statementLevel = meta.statementLevel;
  }
  if (meta.outfitRole) serialized.outfitRole = meta.outfitRole;

  return serialized;
};
