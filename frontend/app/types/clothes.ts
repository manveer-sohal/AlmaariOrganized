export type Slot = "head" | "body" | "legs" | "feet";

export type StyleCategory =
  | "Casual"
  | "Smart Casual"
  | "Formal"
  | "Athletic";

export type OccasionTag =
  | "Everyday"
  | "Work"
  | "Going Out"
  | "Event"
  | "Formal Event"
  | "Travel"
  | "Active";

export type OutfitRole = "Base" | "Layer" | "Accent" | "Statement";

export type EnrichmentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type StylingMetadataConfidence = {
  type: number | null;
  colour: number | null;
  material: number | null;
  fit: number | null;
  pattern: number | null;
  styleCategory: number | null;
  occasionTags: number | null;
  formalityScore: number | null;
  statementLevel: number | null;
  outfitRole: number | null;
};

export type StylingMetadata = {
  styleCategory: StyleCategory | null;
  occasionTags: OccasionTag[];
  formalityScore: number | null;
  statementLevel: number | null;
  outfitRole: OutfitRole | null;
  confidence: StylingMetadataConfidence;
  styleCategorySource?: "ai" | "user" | null;
  occasionTagsSource?: "ai" | "user" | null;
  enrichmentStatus: EnrichmentStatus;
  enrichmentError: string | null;
  enrichedAt: string | null;
  processingStartedAt?: string | null;
  lastRetryAt?: string | null;
  enrichmentAttemptCount?: number;
  userReviewedAt: string | null;
};

export type ClothingItem = {
  _id: string;
  colour: string[];
  type: string;
  material?: string;
  fit?: string;
  pattern?: string;
  slot: Slot;
  imageSrc: string;
  stylingMetadata?: StylingMetadata | null;
};

export type Outfit = {
  uniqueId: string;
  name: string;
  outfit_items: ClothingItem[];
};

export type View =
  | "home"
  | "outfits"
  | "createOutfit"
  | "addClothes"
  | "buyCredits"
  | "clothingDetails"
  | "travelMode";

export type coloursList =
  | "Black"
  | "White"
  | "Brown"
  | "Beige"
  | "Grey"
  | "Pink"
  | "Navy"
  | "Green"
  | "Red"
  | "Blue"
  | "Purple"
  | "Yellow"
  | "Orange"
  | "Camo";

export type typeList =
  | "Shirt"
  | "Jeans"
  | "Sweater"
  | "Jacket"
  | "T-shirt"
  | "Shorts"
  | "Skirt"
  | "Dress"
  | "Blouse"
  | "Trousers"
  | "Hoodie"
  | "Coat"
  | "Cardigan"
  | "Tank Top"
  | "Pajamas"
  | "Socks"
  | "Scarf"
  | "Hat"
  | "Gloves"
  | "Cargos"
  | "Jeans"
  | "Dress Shirt"
  | "Leggings"
  | "Vest"
  | "Swimsuit"
  | "Raincoat"
  | "Overalls"
  | "Jumper"
  | "Blazer"
  | "Crop Top"
  | "Pants"
  | "Capri Pants"
  | "Suit"
  | "Tie"
  | "Belt"
  | "Tunic"
  | "Poncho"
  | "Robe"
  | "Underwear"
  | "Shoes";
