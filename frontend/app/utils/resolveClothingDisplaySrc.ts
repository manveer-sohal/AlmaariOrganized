/**
 * Resolve display image for clothing cards — dual-read compatible with
 * legacy Base64 imageSrc and future object-storage fields.
 */
export type ResolvableClothingImage = {
  imageSrc?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  imageStatus?: string | null;
};

const PLACEHOLDER = "/samples/navy-tshirt.png";

export const resolveClothingDisplaySrc = (
  item: ResolvableClothingImage | null | undefined,
  { preferThumbnail = true }: { preferThumbnail?: boolean } = {},
): string => {
  if (!item) return PLACEHOLDER;
  if (preferThumbnail && item.thumbnailUrl) return item.thumbnailUrl;
  if (item.imageUrl) return item.imageUrl;
  if (item.imageSrc) return item.imageSrc;
  return PLACEHOLDER;
};
