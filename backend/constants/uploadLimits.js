/** Max upload size in bytes (default 5 MB). */
export const UPLOAD_MAX_BYTES = Number(
  process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024,
);

/** Reject images larger than this on any side (decompression bomb guard). */
export const UPLOAD_MAX_DIMENSION = Number(
  process.env.UPLOAD_MAX_DIMENSION || 8000,
);

export const UPLOAD_MIN_DIMENSION = Number(
  process.env.UPLOAD_MIN_DIMENSION || 32,
);

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
