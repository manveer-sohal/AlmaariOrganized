export type StylistMode = "random" | "complete" | "improve" | "selected";

export type StylistOccasion =
  | "Everyday"
  | "Work"
  | "Dinner"
  | "Party"
  | "Formal"
  | "Other";

export type StylistWeather = "Warm" | "Mild" | "Cold";

export type StylistStyle = "Casual" | "Smart casual" | "Minimal" | "Streetwear";

export type OutfitRecommendationLabel =
  | "Safe Choice"
  | "Styled Choice"
  | "Alternative";

export type LayerRole =
  | "base_top"
  | "mid_layer"
  | "outer_layer"
  | "neckwear"
  | "bottom"
  | "shoes"
  | "accessory"
  | "none";

export type WearState = "open" | "closed" | "standard";

export type OutfitLayering = {
  baseTopId?: string;
  midLayerId?: string;
  outerLayerId?: string;
  neckwearId?: string;
  waistAccessoryId?: string;
  wearState?: Record<string, WearState>;
};

export type OutfitRecommendation = {
  id: string;
  label: OutfitRecommendationLabel;
  name: string;
  itemIds: string[];
  explanation: string;
  confidence?: number;
  /** Optional upper-body layering metadata from the stylist */
  layering?: OutfitLayering;
};

export type StylistPreferences = {
  occasion: StylistOccasion;
  weather: StylistWeather;
  style: StylistStyle;
  avoid: string;
};

export type StylistInputs = {
  occasion?: StylistOccasion | null;
  season?: string | null;
  weather?: StylistWeather | null;
  stylePreference?: StylistStyle | null;
  refinementPrompt?: string | null;
  avoid?: string | null;
};

export type StylistRecommendationRequest = StylistPreferences & {
  mode?: StylistMode;
  requiredItemIds?: string[];
  previewItemIds?: string[];
  refinementPrompt?: string;
  parentGenerationId?: string | null;
  priorOutfitSignatures?: string[];
  /** @deprecated Prefer requiredItemIds + mode "selected" */
  anchorItemId?: string;
};

export type StylistRequest = {
  mode: StylistMode;
  requiredItemIds: string[];
  previewItemIds: string[];
  inputs: StylistInputs;
  parentGenerationId?: string | null;
};

export type StylistGeneration = {
  id: string;
  parentGenerationId?: string | null;
  mode: StylistMode;
  prompt?: string | null;
  requiredItemIds: string[];
  /** Hard-constrained items for this generation (same as required at generate time) */
  anchoredItemIds: string[];
  inputs: StylistInputs;
  outfits: OutfitRecommendation[];
  createdAt: string;
};

export type StylistRecommendationResponse = {
  success: boolean;
  recommendations: OutfitRecommendation[];
  creditsDeducted?: number;
  creditBalance?: number;
  generationId?: string;
  mode?: StylistMode;
  requiredItemIds?: string[];
  message?: string;
  code?: string;
  timing?: { totalMs: number; workflow: string };
};

export type StylistFeedback = {
  recommendationId: string;
  outfitItemIds: string[];
  rating: "positive" | "negative";
  occasion?: string;
  style?: string;
  label?: string;
  outfitSignature?: string;
  generationId?: string;
  mode?: StylistMode;
  createdAt: string;
};

export const DEFAULT_STYLIST_PREFERENCES: StylistPreferences = {
  occasion: "Everyday",
  weather: "Mild",
  style: "Casual",
  avoid: "",
};

export const STYLIST_MODE_META: Record<
  StylistMode,
  { label: string; description: string; loading: string }
> = {
  random: {
    label: "Random Outfit",
    description: "Generate complete outfits from your wardrobe.",
    loading: "Creating complete outfits from your wardrobe...",
  },
  complete: {
    label: "Complete My Outfit",
    description:
      "Keep the items already in your preview and fill the missing pieces.",
    loading: "Finding pieces that complete your selected look...",
  },
  improve: {
    label: "Improve This Outfit",
    description:
      "Keep your current pieces and add compatible layers or accessories.",
    loading: "Adding compatible layers and finishing touches...",
  },
  selected: {
    label: "Style Selected Items",
    description: "Build complete outfits around all selected items.",
    loading: "Building outfits around your required pieces...",
  },
};

export const SLOT_LABELS: Record<string, string> = {
  head: "Accessories",
  body: "Top",
  legs: "Bottom",
  feet: "Shoes",
};

export const LAYER_ROLE_LABELS: Record<string, string> = {
  base_top: "Base",
  mid_layer: "Mid layer",
  outer_layer: "Outer",
  neckwear: "Neckwear",
  bottom: "Bottom",
  waist_accessory: "Belt",
  shoes: "Shoes",
  accessory: "Accessory",
};

export const WEAR_STATE_LABELS: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  standard: "",
};
