import type { ClothingItem } from "../types/clothes";

const PLACEHOLDER = "/samples/navy-tshirt.png";

/**
 * Resolve the best display src for wardrobe/UI.
 * Prefer CDN thumbnail/display; never treat processing placeholders as "done".
 */
export const resolveClothingDisplaySrc = (
  item: Partial<ClothingItem> & {
    thumbnailUrl?: string | null;
    imageUrl?: string | null;
    imageSrc?: string;
    imageStatus?: string;
    processingStatus?: string;
  },
  { preferThumbnail = true }: { preferThumbnail?: boolean } = {},
): string => {
  const status = item.processingStatus || item.imageStatus;
  if (
    status &&
    ["upload_pending", "uploaded", "crop_pending", "cropping", "crop_failed"].includes(
      status,
    )
  ) {
    // Keep placeholder while mandatory crop pipeline runs / failed.
    if (preferThumbnail && item.thumbnailUrl) return item.thumbnailUrl;
    if (item.imageUrl) return item.imageUrl;
    return PLACEHOLDER;
  }

  if (preferThumbnail && item.thumbnailUrl) return item.thumbnailUrl;
  if (item.imageUrl) return item.imageUrl;
  if (item.imageSrc) return item.imageSrc;
  return PLACEHOLDER;
};
