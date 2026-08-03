/** Shared crop constants and rembg prep helpers. */

export const CROP_OUTPUT_SIZE = 512;

/**
 * Match image_cropper CROP_MAX_EDGE default so rembg input/output
 * share geometry with the framing preview.
 */
export const CROP_WORK_MAX_EDGE = 640;

/** Absolute floor for react-easy-crop minZoom (prevents near-invisible images). */
export const ABSOLUTE_MIN_USER_ZOOM = 0.2;

export type CropRotation = number;

export type CropServiceMode = "rembg_only" | "subject_square";

export function normalizeCropRotation(deg: number): number {
  let normalized = deg % 360;
  if (normalized > 180) normalized -= 360;
  if (normalized < -180) normalized += 360;
  return Math.round(normalized * 10) / 10;
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/**
 * Downscale a picked file so framing preview and rembg share the same WxH
 * as the cropper's post-resize image (CROP_WORK_MAX_EDGE).
 */
export async function createWorkingImageBlob(
  file: Blob,
  maxEdge: number = CROP_WORK_MAX_EDGE,
): Promise<{ blob: Blob; width: number; height: number }> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageFromUrl(objectUrl);
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    if (!imgW || !imgH) {
      throw new Error("Invalid image dimensions");
    }

    const longest = Math.max(imgW, imgH);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    const width = Math.max(1, Math.round(imgW * scale));
    const height = Math.max(1, Math.round(imgH * scale));

    if (scale === 1 && file.type === "image/png") {
      return { blob: file, width: imgW, height: imgH };
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await canvasToPngBlob(canvas);
    if (!blob) throw new Error("Failed to encode working image");
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
