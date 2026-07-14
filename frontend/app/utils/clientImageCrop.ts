/** Shared client-side square crop math for Add Clothes. */

export const CROP_OUTPUT_SIZE = 512;

/** How far below "fit full image" the zoom slider may go (further shrink). */
export const MIN_ZOOM_SHRINK_FACTOR = 0.25;

/** Absolute floor relative to cover scale (prevents near-invisible images). */
export const ABSOLUTE_MIN_USER_ZOOM = 0.2;

export type CropOffset = { x: number; y: number };

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
) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

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
 * Send this to rembg — the cropper microservice re-centers with transparent pad.
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

/** Photo region for the crop microservice (real pixels, no white pad). */
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
