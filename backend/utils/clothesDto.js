/**
 * Thin wardrobe list DTO — no Base64, no internal keys, no AI blobs.
 */

import { resolveClothingImage } from "./resolveClothingImage.js";

/** Mongo projection for wardrobe list cards. */
export const WARDROBE_LIST_PROJECTION = {
  _id: 1,
  uniqueId: 1,
  type: 1,
  colour: 1,
  material: 1,
  fit: 1,
  pattern: 1,
  favourite: 1,
  isSample: 1,
  slot: 1,
  createdAt: 1,
  "stylingMetadata.styleCategory": 1,
  "stylingMetadata.subtype": 1,
  "imageStorage.provider": 1,
  "imageStorage.status": 1,
  "imageStorage.displayUrl": 1,
  "imageStorage.thumbnailUrl": 1,
  "imageStorage.display.key": 1,
  "imageStorage.thumbnail.key": 1,
  "imageStorage.canonical.key": 1,
  "imageStorage.displayKey": 1,
  "imageStorage.thumbnailKey": 1,
  // Legacy Base64 still needed until migration — excluded when status=ready s3
  imageSrc: 1,
};

export const toWardrobeListItem = (clothing) => {
  const resolved = resolveClothingImage(clothing, { preferThumbnail: true });
  const storage = clothing?.imageStorage;
  const isReadyS3 =
    storage?.provider === "s3" && storage?.status === "ready";

  return {
    _id: clothing._id,
    uniqueId: clothing.uniqueId,
    type: clothing.type,
    subtype: clothing.stylingMetadata?.subtype || null,
    colour: clothing.colour,
    material: clothing.material,
    fit: clothing.fit,
    pattern: clothing.pattern,
    favourite: Boolean(clothing.favourite),
    isSample: Boolean(clothing.isSample),
    slot: clothing.slot,
    styleCategory: clothing.stylingMetadata?.styleCategory || null,
    createdAt: clothing.createdAt,
    thumbnailUrl: resolved.thumbnailUrl || (isReadyS3 ? resolved.imageSrc : null),
    imageUrl: resolved.imageUrl,
    imageStatus: resolved.imageStatus,
    processingStatus: resolved.processingStatus || storage?.status || "legacy",
    // Legacy only: keep imageSrc for unmigrated Base64 cards.
    // Ready S3 items must not ship Base64.
    imageSrc: isReadyS3
      ? resolved.imageSrc
      : typeof clothing.imageSrc === "string" &&
          clothing.imageSrc.startsWith("data:")
        ? clothing.imageSrc
        : resolved.imageSrc,
  };
};

export const toClothingDetailDto = (clothing) => {
  const resolved = resolveClothingImage(clothing, { preferThumbnail: false });
  const plain =
    typeof clothing.toObject === "function" ? clothing.toObject() : { ...clothing };
  const storage = plain.imageStorage;
  const isReadyS3 =
    storage?.provider === "s3" && storage?.status === "ready";

  // Strip internal keys from API detail
  const safeStorage = storage
    ? {
        provider: storage.provider,
        status: storage.status,
        cropMode: storage.cropMode,
        width: storage.display?.width || storage.width,
        height: storage.display?.height || storage.height,
        croppedAt: storage.croppedAt,
        migratedAt: storage.migratedAt,
      }
    : undefined;

  return {
    ...plain,
    imageSrc: isReadyS3 ? resolved.imageSrc : plain.imageSrc,
    imageUrl: resolved.imageUrl,
    thumbnailUrl: resolved.thumbnailUrl,
    imageStatus: resolved.imageStatus,
    processingStatus: resolved.processingStatus,
    imageStorage: safeStorage,
  };
};
