/** Shared client-side square crop math for Add Clothes. */

export const CROP_OUTPUT_SIZE = 512;

/**
 * Match image_cropper CROP_MAX_EDGE default so rembg input/output
 * share geometry with the framing preview.
 */
export const CROP_WORK_MAX_EDGE = 640;

/** How far below "fit full image" the zoom slider may go (further shrink). */
export const MIN_ZOOM_SHRINK_FACTOR = 0.25;

/** Absolute floor relative to cover scale (prevents near-invisible images). */
export const ABSOLUTE_MIN_USER_ZOOM = 0.2;

export type CropOffset = { x: number; y: number };

export type CropServiceMode = "rembg_only" | "subject_square";

export function getCoverScale(
  imgW: number,
  imgH: number,
  size: number = CROP_OUTPUT_SIZE,
) {
  return Math.max(size / imgW, size / imgH);
}

export function getContainScale(
  imgW: number,
  imgH: number,
  size: number = CROP_OUTPUT_SIZE,
) {
  return Math.min(size / imgW, size / imgH);
}

/**
 * Lowest zoom slider value.
 * 1 = cover (fills the square). Contain ratio fits the full image.
 * Below that, the image shrinks further with white padding.
 */
export function getMinUserZoom(
  imgW: number,
  imgH: number,
  size: number = CROP_OUTPUT_SIZE,
) {
  const cover = getCoverScale(imgW, imgH, size);
  const contain = getContainScale(imgW, imgH, size);
  if (!cover || !Number.isFinite(cover)) return ABSOLUTE_MIN_USER_ZOOM;
  const fitFullImageZoom = Math.min(1, contain / cover);
  return Math.max(
    ABSOLUTE_MIN_USER_ZOOM,
    fitFullImageZoom * MIN_ZOOM_SHRINK_FACTOR,
  );
}

export function getDrawScale(
  imgW: number,
  imgH: number,
  userZoom: number,
  size: number = CROP_OUTPUT_SIZE,
) {
  return getCoverScale(imgW, imgH, size) * userZoom;
}

export function clampCropOffset(
  x: number,
  y: number,
  imgW: number,
  imgH: number,
  scale: number,
  size: number = CROP_OUTPUT_SIZE,
): CropOffset {
  const scaledW = imgW * scale;
  const scaledH = imgH * scale;
  // When zoomed in, pan within the crop. When shrunk, pan within the letterbox.
  const maxX = Math.abs(scaledW - size) / 2;
  const maxY = Math.abs(scaledH - size) / 2;

  return {
    x: Math.min(maxX, Math.max(-maxX, x)),
    y: Math.min(maxY, Math.max(-maxY, y)),
  };
}

export function drawSquareCrop(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  userZoom: number,
  offset: CropOffset,
  size: number = CROP_OUTPUT_SIZE,
  background: "white" | "transparent" = "white",
) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  ctx.save();
  if (background === "transparent") {
    ctx.clearRect(0, 0, size, size);
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
  }

  const scale = getDrawScale(imgW, imgH, userZoom, size);
  const baseX = (size - imgW * scale) / 2;
  const baseY = (size - imgH * scale) / 2;
  const x = baseX + offset.x;
  const y = baseY + offset.y;

  ctx.drawImage(img, x, y, imgW * scale, imgH * scale);
  ctx.restore();
}

/**
 * Source pixels visible inside the square crop UI (no white letterbox).
 */
export function getVisibleSourceRect(
  imgW: number,
  imgH: number,
  userZoom: number,
  offset: CropOffset,
  size: number = CROP_OUTPUT_SIZE,
) {
  const scale = getDrawScale(imgW, imgH, userZoom, size);
  const drawX = (size - imgW * scale) / 2 + offset.x;
  const drawY = (size - imgH * scale) / 2 + offset.y;

  const sx = (0 - drawX) / scale;
  const sy = (0 - drawY) / scale;
  const sw = size / scale;
  const sh = size / scale;

  const x0 = Math.max(0, Math.min(imgW, sx));
  const y0 = Math.max(0, Math.min(imgH, sy));
  const x1 = Math.max(0, Math.min(imgW, sx + sw));
  const y1 = Math.max(0, Math.min(imgH, sy + sh));

  return {
    sx: x0,
    sy: y0,
    sw: Math.max(1, x1 - x0),
    sh: Math.max(1, y1 - y0),
  };
}

/** Photo region for analysis / export (real pixels, no white pad). */
export async function exportVisibleSourceRegionBlob(
  img: HTMLImageElement,
  userZoom: number,
  offset: CropOffset,
  size: number = CROP_OUTPUT_SIZE,
): Promise<Blob | null> {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (!imgW || !imgH) return null;

  const { sx, sy, sw, sh } = getVisibleSourceRect(
    imgW,
    imgH,
    userZoom,
    offset,
    size,
  );

  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(sw));
  out.height = Math.max(1, Math.round(sh));
  const ctx = out.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return canvasToPngBlob(out);
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
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

/** Apply current pan/zoom framing to an image blob (e.g. rembg result). */
export async function frameImageBlob(
  source: Blob,
  userZoom: number,
  offset: CropOffset,
  size: number = CROP_OUTPUT_SIZE,
): Promise<Blob | null> {
  const objectUrl = URL.createObjectURL(source);
  try {
    const img = await loadImageFromUrl(objectUrl);
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    if (!imgW || !imgH) return null;

    const nextMin = getMinUserZoom(imgW, imgH, size);
    const clampedZoom = Math.max(nextMin, userZoom);
    const scale = getDrawScale(imgW, imgH, clampedZoom, size);
    const clampedOffset = clampCropOffset(
      offset.x,
      offset.y,
      imgW,
      imgH,
      scale,
      size,
    );

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    drawSquareCrop(ctx, img, clampedZoom, clampedOffset, size, "transparent");
    return canvasToPngBlob(canvas);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
