import {
  colours_List,
  fits_List,
  materials_List,
  occasionTags_List,
  patterns_List,
  styleCategories_List,
  type_List,
} from "../data/constants";
import {
  ClothingItem,
  EnrichmentStatus,
  OccasionTag,
  Slot,
  StyleCategory,
  StylingMetadata,
} from "../types/clothes";

export type ClothingMetadataDraft = {
  type: string;
  colour: string[];
  material: string;
  fit: string;
  pattern: string;
  slot: Slot;
  styleCategory: StyleCategory | null;
  occasionTags: OccasionTag[];
};

const SLOTS: Slot[] = ["head", "body", "legs", "feet"];

const emptyConfidence = (): StylingMetadata["confidence"] => ({
  type: null,
  colour: null,
  material: null,
  fit: null,
  pattern: null,
  styleCategory: null,
  occasionTags: null,
  formalityScore: null,
  statementLevel: null,
  outfitRole: null,
});

export function normalizeStylingMetadata(
  raw: unknown,
): StylingMetadata | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const meta = raw as Record<string, unknown>;
  const confidenceRaw =
    meta.confidence && typeof meta.confidence === "object"
      ? (meta.confidence as Record<string, unknown>)
      : {};

  const styleCategory =
    typeof meta.styleCategory === "string" &&
    styleCategories_List.includes(
      meta.styleCategory as (typeof styleCategories_List)[number],
    )
      ? (meta.styleCategory as StyleCategory)
      : null;

  const occasionTags = Array.isArray(meta.occasionTags)
    ? meta.occasionTags.filter((tag): tag is OccasionTag =>
        occasionTags_List.includes(tag as (typeof occasionTags_List)[number]),
      )
    : [];

  const enrichmentStatus = (
    ["pending", "processing", "completed", "failed"] as EnrichmentStatus[]
  ).includes(meta.enrichmentStatus as EnrichmentStatus)
    ? (meta.enrichmentStatus as EnrichmentStatus)
    : "pending";

  const toConfidence = (value: unknown) =>
    typeof value === "number" && value >= 0 && value <= 1 ? value : null;

  return {
    styleCategory,
    occasionTags,
    formalityScore:
      typeof meta.formalityScore === "number" ? meta.formalityScore : null,
    statementLevel:
      typeof meta.statementLevel === "number" ? meta.statementLevel : null,
    outfitRole:
      typeof meta.outfitRole === "string"
        ? (meta.outfitRole as StylingMetadata["outfitRole"])
        : null,
    confidence: {
      ...emptyConfidence(),
      type: toConfidence(confidenceRaw.type),
      colour: toConfidence(confidenceRaw.colour),
      material: toConfidence(confidenceRaw.material),
      fit: toConfidence(confidenceRaw.fit),
      pattern: toConfidence(confidenceRaw.pattern),
      styleCategory: toConfidence(confidenceRaw.styleCategory),
      occasionTags: toConfidence(confidenceRaw.occasionTags),
      formalityScore: toConfidence(confidenceRaw.formalityScore),
      statementLevel: toConfidence(confidenceRaw.statementLevel),
      outfitRole: toConfidence(confidenceRaw.outfitRole),
    },
    enrichmentStatus,
    enrichmentError:
      typeof meta.enrichmentError === "string" ? meta.enrichmentError : null,
    enrichedAt:
      meta.enrichedAt != null ? String(meta.enrichedAt) : null,
    processingStartedAt:
      meta.processingStartedAt != null
        ? String(meta.processingStartedAt)
        : null,
    lastRetryAt:
      meta.lastRetryAt != null ? String(meta.lastRetryAt) : null,
    enrichmentAttemptCount:
      typeof meta.enrichmentAttemptCount === "number"
        ? meta.enrichmentAttemptCount
        : 0,
    styleCategorySource:
      meta.styleCategorySource === "ai" || meta.styleCategorySource === "user"
        ? meta.styleCategorySource
        : null,
    occasionTagsSource:
      meta.occasionTagsSource === "ai" || meta.occasionTagsSource === "user"
        ? meta.occasionTagsSource
        : null,
    userReviewedAt:
      meta.userReviewedAt != null ? String(meta.userReviewedAt) : null,
  };
}

export function clothingItemToDraft(item: ClothingItem): ClothingMetadataDraft {
  const meta = item.stylingMetadata;
  return {
    type: item.type,
    colour: [...(item.colour ?? [])],
    material: item.material ?? "",
    fit: item.fit ?? "",
    pattern: item.pattern ?? "",
    slot: item.slot,
    styleCategory: meta?.styleCategory ?? null,
    occasionTags: [...(meta?.occasionTags ?? [])],
  };
}

export function validateClothingMetadata(
  draft: ClothingMetadataDraft,
): string | null {
  if (!type_List.includes(draft.type)) {
    return "Enter a valid clothing type.";
  }
  if (draft.colour.length === 0) {
    return "Add at least one colour.";
  }
  if (!draft.colour.every((colour) => colours_List.includes(colour))) {
    return "One or more colours are invalid.";
  }
  if (!materials_List.includes(draft.material)) {
    return "Enter a valid material.";
  }
  if (!fits_List.includes(draft.fit)) {
    return "Enter a valid fit.";
  }
  if (!patterns_List.includes(draft.pattern)) {
    return "Enter a valid pattern.";
  }
  if (!SLOTS.includes(draft.slot)) {
    return "Select a valid slot.";
  }
  if (
    draft.styleCategory != null &&
    !styleCategories_List.includes(draft.styleCategory)
  ) {
    return "Select a valid style category.";
  }
  if (
    !draft.occasionTags.every((tag) =>
      occasionTags_List.includes(tag as (typeof occasionTags_List)[number]),
    )
  ) {
    return "One or more occasion tags are invalid.";
  }
  return null;
}

export function normalizeClothingItem(raw: Record<string, unknown>): ClothingItem {
  return {
    _id: String(raw._id),
    type: String(raw.type ?? ""),
    colour: Array.isArray(raw.colour) ? raw.colour.map(String) : [],
    material: raw.material != null ? String(raw.material) : undefined,
    fit: raw.fit != null ? String(raw.fit) : undefined,
    pattern: raw.pattern != null ? String(raw.pattern) : undefined,
    slot: String(raw.slot ?? "body") as Slot,
    imageSrc: String(raw.imageSrc ?? ""),
    stylingMetadata: normalizeStylingMetadata(raw.stylingMetadata),
  };
}
