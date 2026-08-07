/**
 * Resolve clothing images for API/UI.
 *
 * S3 ready records: thumbnail → display → canonical CDN URLs.
 * Never expose uncropped source as the normal wardrobe image.
 * Legacy: imageSrc Base64 / samples / placeholder.
 */

import { PROCESSING_IMAGE_PLACEHOLDER } from "../constants/imageProcessing.js";

const PLACEHOLDER = PROCESSING_IMAGE_PLACEHOLDER;

const deliveryUrlForKey = (key, storage) => {
  if (!key) return null;
  if (storage?.displayUrl && storage.displayKey === key) return storage.displayUrl;
  if (storage?.thumbnailUrl && storage.thumbnailKey === key) {
    return storage.thumbnailUrl;
  }
  const cdn =
    process.env.IMAGE_CDN_BASE_URL ||
    (process.env.AWS_CLOUDFRONT_DOMAIN
      ? `https://${String(process.env.AWS_CLOUDFRONT_DOMAIN)
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "")}`
      : "");
  if (cdn) return `${cdn.replace(/\/$/, "")}/${key}`;
  return null;
};

/**
 * @param {object} clothing
 * @param {{ preferThumbnail?: boolean, variant?: "thumbnail"|"display"|"canonical"|"source" }} [opts]
 */
export const resolveClothingImage = (clothing, opts = {}) => {
  const preferThumbnail = opts.preferThumbnail !== false;
  const variant = opts.variant || (preferThumbnail ? "thumbnail" : "display");
  const storage = clothing?.imageStorage || null;
  const provider = storage?.provider || "legacy-base64";
  const status = storage?.status || (provider === "s3" ? "upload_pending" : "legacy");

  const thumbKey = storage?.thumbnail?.key || storage?.thumbnailKey || null;
  const displayKey = storage?.display?.key || storage?.displayKey || null;
  const canonicalKey = storage?.canonical?.key || null;
  const sourceKey = storage?.source?.key || storage?.originalKey || null;

  let thumbnailUrl =
    storage?.thumbnailUrl ||
    deliveryUrlForKey(thumbKey, storage) ||
    null;
  let displayUrl =
    storage?.displayUrl ||
    deliveryUrlForKey(displayKey, storage) ||
    deliveryUrlForKey(canonicalKey, storage) ||
    null;
  const canonicalUrl = deliveryUrlForKey(canonicalKey, storage);

  // Processing / failed S3 records: never fall back to uncropped source for wardrobe UI.
  const isS3 = provider === "s3";
  const isReady = status === "ready" || status === "legacy";
  const isFailed = ["crop_failed", "upload_failed", "analysis_failed"].includes(
    status,
  );
  const isProcessing =
    isS3 &&
    !isReady &&
    !isFailed &&
    status !== "legacy";

  if (isS3 && isReady) {
    const primary =
      variant === "canonical"
        ? canonicalUrl || displayUrl || thumbnailUrl
        : variant === "display"
          ? displayUrl || canonicalUrl || thumbnailUrl
          : thumbnailUrl || displayUrl || canonicalUrl;

    if (primary) {
      return {
        imageSrc: primary,
        imageUrl: displayUrl || canonicalUrl,
        thumbnailUrl: thumbnailUrl || displayUrl || canonicalUrl,
        imageStatus: "ready",
        storageProvider: provider,
        processingStatus: status,
      };
    }
  }

  if (isProcessing || (isS3 && isFailed && !displayUrl && !thumbnailUrl)) {
    return {
      imageSrc: PLACEHOLDER,
      imageUrl: null,
      thumbnailUrl: null,
      imageStatus: isFailed ? status : "processing",
      storageProvider: provider,
      processingStatus: status,
      // Source key never returned as wardrobe display URL
      _sourceKeyInternal: sourceKey,
    };
  }

  // Legacy Base64 / samples
  const legacy = typeof clothing?.imageSrc === "string" ? clothing.imageSrc : "";
  let imageStatus = "legacy";
  if (legacy.startsWith("/samples/")) imageStatus = "sample";
  else if (legacy.startsWith("data:")) imageStatus = "legacy_base64";
  else if (legacy.startsWith("http")) imageStatus = "url";
  else if (!legacy) imageStatus = "placeholder";

  return {
    imageSrc: legacy || PLACEHOLDER,
    imageUrl: legacy && !legacy.startsWith("data:") ? legacy : null,
    thumbnailUrl: null,
    imageStatus,
    storageProvider: provider,
    processingStatus: status,
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
    processingStatus: resolved.processingStatus,
  };
};
