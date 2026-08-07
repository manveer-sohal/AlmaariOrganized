/**
 * Fields required for stylist filtering, scoring, layering, and ID validation.
 * Explicitly excludes imageSrc / imageStorage blobs.
 */
export const STYLIST_CLOTHING_PROJECTION = {
  _id: 1,
  uniqueId: 1,
  userId: 1,
  type: 1,
  colour: 1,
  season: 1,
  waterproof: 1,
  slot: 1,
  material: 1,
  fit: 1,
  pattern: 1,
  favourite: 1,
  isSample: 1,
  stylingMetadata: 1,
  createdAt: 1,
};

export const assertNoImageSrc = (items, context = "stylist") => {
  if (process.env.NODE_ENV === "production") return;
  for (const item of items || []) {
    if (item && Object.prototype.hasOwnProperty.call(item, "imageSrc")) {
      throw new Error(
        `${context}: imageSrc must not be present on stylist wardrobe items`,
      );
    }
  }
};
