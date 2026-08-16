import type { Area } from "react-easy-crop";
import { CROP_OUTPUT_SIZE } from "./clientImageCrop";

export type { Area };

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Failed to load image")));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/**
 * Extract a square crop from an image using react-easy-crop pixel coordinates,
 * then normalize to a transparent 512×512 PNG (wardrobe output size).
 */
export async function getCroppedClothingBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  outputSize: number = CROP_OUTPUT_SIZE,
): Promise<Blob | null> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const rotRad = getRadianAngle(rotation);
  const { width: boxWidth, height: boxHeight } = rotateSize(
    image.naturalWidth,
    image.naturalHeight,
    rotation,
  );

  canvas.width = boxWidth;
  canvas.height = boxHeight;

  ctx.translate(boxWidth / 2, boxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) return null;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) return null;

  outputCtx.drawImage(
    croppedCanvas,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise((resolve) => {
    outputCanvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export { rotateSize, getRadianAngle };
