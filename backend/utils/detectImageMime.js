/**
 * Magic-byte MIME sniffing for uploads. Node 18–compatible (no file-type dep).
 */

const startsWith = (buffer, bytes) => {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
};

/**
 * @param {Buffer} buffer
 * @returns {string | null} MIME type or null if unrecognized
 */
export const detectImageMimeFromBuffer = (buffer) => {
  if (!buffer?.length) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) {
    return "image/png";
  }

  // JPEG: FF D8 FF
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    return "image/jpeg";
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
};
