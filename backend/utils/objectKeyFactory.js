/**
 * Canonical S3 object-key factory.
 * Keys use Mongo user/clothing IDs — never email or browser-supplied paths.
 */

import { IMAGE_VARIANTS } from "../constants/imageProcessing.js";

const sanitizeSegment = (value, fallback = "unknown") =>
  String(value || fallback)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 128) || fallback;

/**
 * @param {object} args
 * @param {string} args.userId - Mongo user ObjectId string
 * @param {string} args.clothingId - Mongo clothing ObjectId string
 * @param {"source"|"canonical"|"display"|"thumbnail"} args.variant
 * @param {string} [args.contentHash] - required for source
 * @param {number} [args.version=1]
 * @param {string} [args.ext]
 */
export const buildClothingObjectKey = ({
  userId,
  clothingId,
  variant,
  contentHash,
  version = 1,
  ext,
}) => {
  if (!IMAGE_VARIANTS.includes(variant)) {
    throw new Error(`Invalid image variant: ${variant}`);
  }
  const uid = sanitizeSegment(userId);
  const cid = sanitizeSegment(clothingId);
  const ver = Math.max(1, Number(version) || 1);

  if (variant === "source") {
    const hash = sanitizeSegment(contentHash, "pending");
    const sourceExt = ext || "bin";
    return `users/${uid}/clothing/${cid}/source/${hash}.${sourceExt}`;
  }

  const fileExt = ext || "webp";
  return `users/${uid}/clothing/${cid}/${variant}/v${ver}.${fileExt}`;
};

/** Collect all known keys from an imageStorage document for cleanup. */
export const collectStorageKeys = (imageStorage) => {
  if (!imageStorage || typeof imageStorage !== "object") return [];
  const keys = new Set();
  for (const part of ["source", "canonical", "display", "thumbnail"]) {
    const key = imageStorage[part]?.key;
    if (key) keys.add(key);
  }
  // Legacy flat keys from P0/P1 foundation
  for (const flat of ["originalKey", "displayKey", "thumbnailKey"]) {
    if (imageStorage[flat]) keys.add(imageStorage[flat]);
  }
  return [...keys];
};
