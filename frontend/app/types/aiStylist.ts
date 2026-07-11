export type StylistOccasion =
  | "Everyday"
  | "Work"
  | "Dinner"
  | "Party"
  | "Formal"
  | "Other";

export type StylistWeather = "Warm" | "Mild" | "Cold";

export type StylistStyle =
  | "Casual"
  | "Smart casual"
  | "Minimal"
  | "Streetwear";

export type OutfitRecommendationLabel =
  | "Safe Choice"
  | "Styled Choice"
  | "Alternative";

export type OutfitRecommendation = {
  id: string;
  label: OutfitRecommendationLabel;
  name: string;
  itemIds: string[];
  explanation: string;
  confidence?: number;
};

export type StylistPreferences = {
  occasion: StylistOccasion;
  weather: StylistWeather;
  style: StylistStyle;
  avoid: string;
};

export type StylistRecommendationRequest = StylistPreferences & {
  anchorItemId?: string;
};

export type StylistRecommendationResponse = {
  success: boolean;
  recommendations: OutfitRecommendation[];
  creditsDeducted?: number;
  creditBalance?: number;
  message?: string;
  code?: string;
};

export type StylistFeedback = {
  recommendationId: string;
  outfitItemIds: string[];
  rating: "positive" | "negative";
  occasion?: string;
  style?: string;
  createdAt: string;
};

export const DEFAULT_STYLIST_PREFERENCES: StylistPreferences = {
  occasion: "Everyday",
  weather: "Mild",
  style: "Casual",
  avoid: "",
};

export const SLOT_LABELS: Record<string, string> = {
  head: "Accessories",
  body: "Top",
  legs: "Bottom",
  feet: "Shoes",
};
