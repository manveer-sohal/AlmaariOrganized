export type ClothingTagField = {
  value: string | null;
  confidence: number;
};

export type ColourListTagField = {
  value: string[] | null;
  confidence: number;
};

export type ClothingAnalysisTags = {
  type: ClothingTagField;
  colour: ColourListTagField;
  material: ClothingTagField;
  fit: ClothingTagField;
  pattern: ClothingTagField;
};

export type AnalyzeClothingResponse = {
  success: boolean;
  tags?: ClothingAnalysisTags;
  validTagCount?: number;
  creditsDeducted?: number;
  creditBalance?: number;
  message?: string;
};
