/** Image processing / wardrobe readiness states (P2). */
export const IMAGE_PROCESSING_STATUSES = [
  "upload_pending",
  "uploaded",
  "crop_pending",
  "cropping",
  "cropped",
  "analyzing",
  "ready",
  "upload_failed",
  "crop_failed",
  "analysis_failed",
  "legacy",
  "deletion_pending",
];

/** Variants stored under a clothing item in object storage. */
export const IMAGE_VARIANTS = ["source", "canonical", "display", "thumbnail"];

/** Placeholder shown while S3 processing is in flight (never a final wardrobe asset). */
export const PROCESSING_IMAGE_PLACEHOLDER = "/samples/navy-tshirt.png";

export const DISPLAY_MAX_EDGE = Number(process.env.IMAGE_DISPLAY_MAX_EDGE || 1024);
export const THUMBNAIL_MAX_EDGE = Number(process.env.IMAGE_THUMBNAIL_MAX_EDGE || 256);

/** Preferred derivative format (WebP with alpha for rembg PNGs). */
export const DERIVATIVE_FORMAT = "webp";
export const DERIVATIVE_CONTENT_TYPE = "image/webp";
