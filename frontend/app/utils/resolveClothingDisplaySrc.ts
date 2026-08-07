import type { ClothingItem } from "../types/clothes";

const PLACEHOLDER = "/samples/navy-tshirt.png";

/** Image statuses where CDN derivatives are not ready yet. */
export const IMAGE_PROCESSING_STATUSES = [
  "upload_pending",
  "uploaded",
  "crop_pending",
  "cropping",
  "cropped",
  "analyzing",
] as const;

export const isImageProcessingStatus = (
  status?: string | null,
): boolean =>
  Boolean(
    status &&
      (IMAGE_PROCESSING_STATUSES as readonly string[]).includes(status),
  );

export const isPlaceholderImageSrc = (src?: string | null): boolean =>
  !src || src.startsWith("/samples/");

/**
 * Resolve the best display src for wardrobe/UI.
 * Prefer CDN thumbnail/display; keep client crop previews while processing.
 */
export const resolveClothingDisplaySrc = (
  item: Partial<ClothingItem> & {
    thumbnailUrl?: string | null;
    imageUrl?: string | null;
    imageSrc?: string;
    imageStatus?: string | null;
    processingStatus?: string | null;
  },
  { preferThumbnail = true }: { preferThumbnail?: boolean } = {},
): string => {
  const status = item.processingStatus || item.imageStatus;

  if (isImageProcessingStatus(status) || status === "crop_failed") {
    // Prefer real preview (optimistic data/blob URL or early CDN) over sample.
    if (preferThumbnail && item.thumbnailUrl) return item.thumbnailUrl;
    if (item.imageUrl) return item.imageUrl;
    if (item.imageSrc && !isPlaceholderImageSrc(item.imageSrc)) {
      return item.imageSrc;
    }
    return PLACEHOLDER;
  }

  if (preferThumbnail && item.thumbnailUrl) return item.thumbnailUrl;
  if (item.imageUrl) return item.imageUrl;
  if (item.imageSrc) return item.imageSrc;
  return PLACEHOLDER;
};
