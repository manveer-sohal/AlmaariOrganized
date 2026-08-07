/**
 * Resolve a displayable clothing image without requiring callers to know
 * about legacy Base64 vs future object-storage fields.
 *
 * Dual-read order:
 * 1. Object-storage display/thumbnail URL or key (when configured)
 * 2. Legacy imageSrc (data URL or /samples/...)
 * 3. Safe placeholder
 */

const PLACEHOLDER = "/samples/navy-tshirt.png";

/**
 * @param {object} clothing - lean clothing document or API row
 * @param {{ preferThumbnail?: boolean }} [opts]
 * @returns {{
 *   imageSrc: string,
 *   imageUrl: string | null,
 *   thumbnailUrl: string | null,
 *   imageStatus: string,
 *   storageProvider: string
 * }}
 */
export const resolveClothingImage = (clothing, opts = {}) => {
  const preferThumbnail = Boolean(opts.preferThumbnail);
  const storage = clothing?.imageStorage || null;
  const provider = storage?.provider || "legacy-base64";

  let imageUrl = null;
  let thumbnailUrl = null;

  if (storage && (storage.displayUrl || storage.thumbnailUrl)) {
    imageUrl = storage.displayUrl || null;
    thumbnailUrl = storage.thumbnailUrl || null;
  } else if (storage && (storage.displayKey || storage.thumbnailKey)) {
    // Keys alone are not public URLs; callers with a storage adapter may resolve.
    imageUrl = storage.displayKey || null;
    thumbnailUrl = storage.thumbnailKey || null;
  }

  const legacy = typeof clothing?.imageSrc === "string" ? clothing.imageSrc : "";
  const primary =
    (preferThumbnail && thumbnailUrl) ||
    imageUrl ||
    thumbnailUrl ||
    legacy ||
    PLACEHOLDER;

  let imageStatus = "legacy";
  if (imageUrl || thumbnailUrl) imageStatus = "object_storage";
  else if (legacy.startsWith("/samples/")) imageStatus = "sample";
  else if (legacy.startsWith("data:")) imageStatus = "legacy_base64";
  else if (!legacy) imageStatus = "placeholder";

  return {
    imageSrc: primary,
    imageUrl: imageUrl || (legacy && !legacy.startsWith("data:") ? legacy : null),
    thumbnailUrl: thumbnailUrl || null,
    imageStatus,
    storageProvider: provider,
  };
};

/** Attach thin image DTO fields onto a clothing object for API responses. */
export const withResolvedImageFields = (clothing, opts) => {
  if (!clothing || typeof clothing !== "object") return clothing;
  const resolved = resolveClothingImage(clothing, opts);
  const plain =
    typeof clothing.toObject === "function" ? clothing.toObject() : { ...clothing };
  return {
    ...plain,
    imageSrc: resolved.imageSrc,
    imageUrl: resolved.imageUrl,
    thumbnailUrl: resolved.thumbnailUrl,
    imageStatus: resolved.imageStatus,
  };
};
