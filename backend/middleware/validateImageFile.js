import sizeOf from "image-size";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  UPLOAD_MAX_DIMENSION,
  UPLOAD_MIN_DIMENSION,
} from "../constants/uploadLimits.js";
import { detectImageMimeFromBuffer } from "../utils/detectImageMime.js";

/**
 * Validates multer memory buffer: magic-byte MIME, decodable dimensions, size caps.
 * Must run after upload.single("image").
 */
export const validateImageFile = async (req, res, next) => {
  const file = req.file;

  if (!file?.buffer?.length) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const mime = detectImageMimeFromBuffer(file.buffer);
    if (!mime || !ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
      return res.status(400).json({
        error: "Invalid image type. Allowed formats: JPEG, PNG, WebP",
      });
    }

    let dimensions;
    try {
      dimensions = sizeOf(file.buffer);
    } catch {
      return res.status(400).json({ error: "Unable to decode image file" });
    }

    const width = dimensions.width ?? 0;
    const height = dimensions.height ?? 0;

    if (
      width < UPLOAD_MIN_DIMENSION ||
      height < UPLOAD_MIN_DIMENSION ||
      width > UPLOAD_MAX_DIMENSION ||
      height > UPLOAD_MAX_DIMENSION
    ) {
      return res.status(400).json({
        error: `Image dimensions must be between ${UPLOAD_MIN_DIMENSION}px and ${UPLOAD_MAX_DIMENSION}px per side`,
      });
    }

    // Normalize MIME from magic bytes (ignore untrusted client Content-Type).
    req.file.mimetype = mime;
    return next();
  } catch (error) {
    console.error("[upload] image validation failed:", error);
    return res.status(400).json({ error: "Invalid image file" });
  }
};
