export type SampleImage = {
  src: string;
  alt: string;
};

/** Sample wardrobe assets served from /public/samples */
export const LANDING_SAMPLE_IMAGES: SampleImage[] = [
  { src: "/samples/white-shirt.png", alt: "White shirt" },
  { src: "/samples/navy-tshirt.png", alt: "Navy t-shirt" },
  { src: "/samples/olive-hoodie.png", alt: "Olive hoodie" },
  { src: "/samples/black-blazer.png", alt: "Black blazer" },
  { src: "/samples/blue-jeans.png", alt: "Blue jeans" },
  { src: "/samples/khaki-chinos.png", alt: "Khaki chinos" },
  { src: "/samples/black-trousers.png", alt: "Black trousers" },
  { src: "/samples/beige-cap.png", alt: "Beige cap" },
  { src: "/samples/white-sneakers.png", alt: "White sneakers" },
  { src: "/samples/brown-boots.png", alt: "Brown boots" },
];

/** Hero wardrobe grid (8 tiles) — includes the featured outfit pieces */
export const SHOWCASE_WARDROBE: SampleImage[] = [
  LANDING_SAMPLE_IMAGES[0],
  LANDING_SAMPLE_IMAGES[1],
  LANDING_SAMPLE_IMAGES[2],
  LANDING_SAMPLE_IMAGES[3],
  LANDING_SAMPLE_IMAGES[5],
  LANDING_SAMPLE_IMAGES[8],
  LANDING_SAMPLE_IMAGES[7],
  LANDING_SAMPLE_IMAGES[4],
];

/** Hero outfit builder slots: cap, top, bottom, shoes */
export const SHOWCASE_OUTFIT: SampleImage[] = [
  LANDING_SAMPLE_IMAGES[7], // beige cap
  LANDING_SAMPLE_IMAGES[0], // white shirt
  LANDING_SAMPLE_IMAGES[5], // khaki chinos
  LANDING_SAMPLE_IMAGES[8], // white sneakers
];

/** Wardrobe tiles highlighted when the outfit is ready */
export const SHOWCASE_OUTFIT_SRCS = new Set(
  SHOWCASE_OUTFIT.map((item) => item.src),
);

/** AI stylist preview rows (3 outfits × 3 pieces) */
export const STYLIST_OUTFIT_ROWS: SampleImage[][] = [
  [
    LANDING_SAMPLE_IMAGES[0],
    LANDING_SAMPLE_IMAGES[5],
    LANDING_SAMPLE_IMAGES[8],
  ],
  [
    LANDING_SAMPLE_IMAGES[3],
    LANDING_SAMPLE_IMAGES[4],
    LANDING_SAMPLE_IMAGES[9],
  ],
  [
    LANDING_SAMPLE_IMAGES[2],
    LANDING_SAMPLE_IMAGES[6],
    LANDING_SAMPLE_IMAGES[8],
  ],
];

/** Wardrobe catalog preview (6 tiles) */
export const WARDROBE_PREVIEW = LANDING_SAMPLE_IMAGES.slice(0, 6);
