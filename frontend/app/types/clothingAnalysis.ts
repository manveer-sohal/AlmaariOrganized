export type ClothingTagField = {
  value: string | null;
  confidence: number;
};

export type ColourListTagField = {
  value: string[] | null;
  confidence: number;
};

export type NumberTagField = {
  value: number | null;
  confidence: number;
};

export type StringListTagField = {
  value: string[] | null;
  confidence: number;
};

export type ClothingAnalysisTags = {
  type: ClothingTagField;
  colour: ColourListTagField;
  material: ClothingTagField;
  fit: ClothingTagField;
  pattern: ClothingTagField;
  /** Optional precise subtype (e.g. button_up, polo, jorts). */
  subtype?: ClothingTagField;
  styleCategory?: ClothingTagField;
  occasionTags?: StringListTagField;
  formalityScore?: NumberTagField;
  statementLevel?: NumberTagField;
  outfitRole?: ClothingTagField;
};

export type AnalyzeClothingResponse = {
  success: boolean;
  tags?: ClothingAnalysisTags;
  validTagCount?: number;
  creditsDeducted?: number;
  creditBalance?: number;
  message?: string;
};
