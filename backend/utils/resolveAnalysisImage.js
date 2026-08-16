/**
 * Build a base64 payload for FastAPI analyze from a clothing document.
 * Supports legacy data URLs and S3-backed records (canonical preferred).
 */

import { getImageStorageAdapter } from "../services/imageStorage.service.js";

const toBase64Payload = (buffer) => {
  const b64 = Buffer.isBuffer(buffer)
    ? buffer.toString("base64")
    : Buffer.from(buffer).toString("base64");
  // FastAPI accepts raw base64; data URL also works via stripDataUrl.
  return b64;
};

/**
 * @param {object} clothing - Clothes lean/doc with imageSrc / imageStorage
 * @param {{ getAdapter?: () => Promise<object> }} [options]
 * @returns {Promise<string>} raw base64 (no data: prefix)
 */
export const resolveAnalysisImageBase64 = async (
  clothing,
  { getAdapter = getImageStorageAdapter } = {},
) => {
  if (!clothing) {
    throw new Error("Missing clothing for analysis image");
  }

  const storage = clothing.imageStorage;
  const provider = storage?.provider;

  // Prefer canonical object from S3 (cropped garment), then display, then source.
  if (provider === "s3") {
    const key =
      storage?.canonical?.key ||
      storage?.display?.key ||
      storage?.displayKey ||
      storage?.source?.key ||
      storage?.originalKey ||
      null;

    if (key) {
      const adapter = await getAdapter();
      if (
        adapter.provider === "s3" &&
        typeof adapter.getObjectBuffer === "function"
      ) {
        const buf = await adapter.getObjectBuffer(key);
        return toBase64Payload(buf);
      }
    }
  }

  const src =
    typeof clothing.imageSrc === "string" ? clothing.imageSrc.trim() : "";
  if (!src) {
    throw new Error("Missing image for enrichment");
  }

  // Legacy Base64 data URL
  if (src.startsWith("data:")) {
    const comma = src.indexOf(",");
    if (comma === -1) throw new Error("Invalid data URL for enrichment");
    return src.slice(comma + 1);
  }

  // Raw base64 blob already
  if (
    /^[A-Za-z0-9+/=\s]+$/.test(src) &&
    src.length > 100 &&
    !src.startsWith("http")
  ) {
    return src.replace(/\s+/g, "");
  }

  // CDN / HTTPS URL left in imageSrc after S3 ready — fetch bytes
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const res = await fetch(src);
    if (!res.ok) {
      throw new Error(`Failed to fetch enrichment image (${res.status})`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return toBase64Payload(buf);
  }

  // Sample path — not useful for AI; fail clearly
  if (src.startsWith("/samples/")) {
    throw new Error("Cannot enrich placeholder/sample image");
  }

  throw new Error("Unsupported image reference for enrichment");
};
