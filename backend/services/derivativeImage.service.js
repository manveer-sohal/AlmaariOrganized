/**
 * Create display/thumbnail WebP derivatives from a canonical cropped buffer.
 * sharp is loaded lazily so legacy (non-S3) boot does not require it at import time.
 */

import {
  DISPLAY_MAX_EDGE,
  THUMBNAIL_MAX_EDGE,
  DERIVATIVE_CONTENT_TYPE,
  DERIVATIVE_FORMAT,
} from "../constants/imageProcessing.js";

let _sharpPromise;

const loadSharp = async () => {
  if (!_sharpPromise) {
    _sharpPromise = import("sharp")
      .then((mod) => mod.default || mod)
      .catch((err) => {
        _sharpPromise = undefined;
        const wrapped = new Error(
          "sharp is required for image derivatives — run npm ci in the API container/image",
        );
        wrapped.cause = err;
        throw wrapped;
      });
  }
  return _sharpPromise;
};

const resizeToWebp = async (buffer, maxEdge) => {
  const sharp = await loadSharp();
  const image = sharp(buffer, { failOn: "none" }).rotate();
  const meta = await image.metadata();
  const width = meta.width || maxEdge;
  const height = meta.height || maxEdge;
  const needsResize = width > maxEdge || height > maxEdge;

  let pipeline = image;
  if (needsResize) {
    pipeline = pipeline.resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const out = await pipeline.webp({ quality: 82, alphaQuality: 90 }).toBuffer({
    resolveWithObject: true,
  });

  return {
    buffer: out.data,
    contentType: DERIVATIVE_CONTENT_TYPE,
    format: DERIVATIVE_FORMAT,
    width: out.info.width,
    height: out.info.height,
    bytes: out.data.length,
  };
};

export const createDisplayDerivative = (canonicalBuffer) =>
  resizeToWebp(canonicalBuffer, DISPLAY_MAX_EDGE);

export const createThumbnailDerivative = (canonicalBuffer) =>
  resizeToWebp(canonicalBuffer, THUMBNAIL_MAX_EDGE);

/**
 * Validate crop/rembg output before treating it as canonical.
 */
export const validateCroppedImageBuffer = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 32) {
    return { ok: false, reason: "empty_or_tiny" };
  }
  if (buffer.length > Number(process.env.S3_MAX_UPLOAD_BYTES || 5_242_880) * 2) {
    return { ok: false, reason: "too_large" };
  }
  try {
    const sharp = await loadSharp();
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    if (!meta.width || !meta.height) {
      return { ok: false, reason: "undecodable" };
    }
    if (meta.width < 8 || meta.height < 8) {
      return { ok: false, reason: "dimensions_too_small" };
    }
    return {
      ok: true,
      width: meta.width,
      height: meta.height,
      format: meta.format,
      hasAlpha: Boolean(meta.hasAlpha),
    };
  } catch (err) {
    if (err?.message?.includes("sharp is required")) {
      return { ok: false, reason: "sharp_missing" };
    }
    return { ok: false, reason: "undecodable" };
  }
};
