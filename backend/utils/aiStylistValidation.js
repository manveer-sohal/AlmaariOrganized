const LABELS = ["Safe Choice", "Styled Choice", "Alternative"];
const STYLIST_MODES = ["random", "complete", "improve", "selected"];

const asStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
};

export const validateRecommendationRequest = (body) => {
  const errors = [];
  if (body.anchorItemId != null && typeof body.anchorItemId !== "string") {
    errors.push("anchorItemId must be a string");
  }
  if (body.mode != null && !STYLIST_MODES.includes(body.mode)) {
    errors.push(`mode must be one of: ${STYLIST_MODES.join(", ")}`);
  }
  if (
    body.requiredItemIds != null &&
    !Array.isArray(body.requiredItemIds)
  ) {
    errors.push("requiredItemIds must be an array");
  }
  if (body.previewItemIds != null && !Array.isArray(body.previewItemIds)) {
    errors.push("previewItemIds must be an array");
  }
  if (
    body.refinementPrompt != null &&
    typeof body.refinementPrompt !== "string"
  ) {
    errors.push("refinementPrompt must be a string");
  }

  return {
    mode: body.mode && STYLIST_MODES.includes(body.mode) ? body.mode : null,
    requiredItemIds: asStringArray(body.requiredItemIds),
    previewItemIds: asStringArray(body.previewItemIds),
    refinementPrompt:
      typeof body.refinementPrompt === "string" ? body.refinementPrompt : "",
    parentGenerationId:
      typeof body.parentGenerationId === "string"
        ? body.parentGenerationId
        : null,
    priorOutfitSignatures: asStringArray(body.priorOutfitSignatures),
    anchorItemId: body.anchorItemId || null,
    occasion: body.occasion || "Everyday",
    weather: body.weather || "Mild",
    style: body.style || "Casual",
    avoid: typeof body.avoid === "string" ? body.avoid : "",
    errors,
  };
};

export const validateRecommendations = ({
  recommendations,
  allowedIds,
  anchorItemId,
  requiredItemIds,
}) => {
  const required = requiredItemIds?.length
    ? requiredItemIds
    : anchorItemId
      ? [anchorItemId]
      : [];

  const seenSignatures = new Set();
  const cleaned = [];

  for (const rec of recommendations) {
    if (!LABELS.includes(rec.label)) continue;
    if (!Array.isArray(rec.itemIds) || rec.itemIds.length === 0) continue;

    const uniqueIds = [...new Set(rec.itemIds.map(String))];
    if (uniqueIds.length !== rec.itemIds.length) continue;
    if (!uniqueIds.every((id) => allowedIds.has(id))) continue;
    if (required.some((id) => !uniqueIds.includes(String(id)))) continue;

    const signature = uniqueIds.sort().join("|");
    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);

    cleaned.push({
      id: rec.id || `${rec.label}-${signature}`,
      label: rec.label,
      name: rec.name || rec.label,
      itemIds: uniqueIds,
      explanation: String(rec.explanation || "").slice(0, 400),
      confidence:
        typeof rec.confidence === "number"
          ? Math.max(0, Math.min(1, rec.confidence))
          : undefined,
    });
  }

  return cleaned.slice(0, 3);
};

export const validateFeedbackRequest = (body) => {
  if (!body?.recommendationId || typeof body.recommendationId !== "string") {
    return { error: "recommendationId is required" };
  }
  if (!Array.isArray(body.outfitItemIds) || body.outfitItemIds.length === 0) {
    return { error: "outfitItemIds is required" };
  }
  if (!["positive", "negative"].includes(body.rating)) {
    return { error: "rating must be positive or negative" };
  }

  const allowedReasons = [
    "Too formal",
    "Too casual",
    "Colours do not match",
    "Not my style",
    "Wrong season",
    "Poor item combination",
  ];

  let reasons;
  if (body.reasons !== undefined) {
    if (!Array.isArray(body.reasons)) {
      return { error: "reasons must be an array" };
    }
    reasons = body.reasons.filter((reason) => allowedReasons.includes(reason));
  }

  const outfitItemIds = body.outfitItemIds.map(String);
  const outfitSignature =
    typeof body.outfitSignature === "string" && body.outfitSignature.trim()
      ? body.outfitSignature.trim()
      : [...outfitItemIds].sort().join("|");

  return {
    recommendationId: body.recommendationId,
    outfitItemIds,
    outfitSignature,
    label: typeof body.label === "string" ? body.label : undefined,
    rating: body.rating,
    reasons,
    occasion: body.occasion,
    style: body.style,
    generationId:
      typeof body.generationId === "string" ? body.generationId : undefined,
    mode: typeof body.mode === "string" ? body.mode : undefined,
  };
};
