const LABELS = ["Safe Choice", "Styled Choice", "Alternative"];

export const validateRecommendationRequest = (body) => {
  const errors = [];
  if (body.anchorItemId != null && typeof body.anchorItemId !== "string") {
    errors.push("anchorItemId must be a string");
  }
  return {
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
}) => {
  const seenSignatures = new Set();
  const cleaned = [];

  for (const rec of recommendations) {
    if (!LABELS.includes(rec.label)) continue;
    if (!Array.isArray(rec.itemIds) || rec.itemIds.length === 0) continue;

    const uniqueIds = [...new Set(rec.itemIds.map(String))];
    if (uniqueIds.length !== rec.itemIds.length) continue;
    if (!uniqueIds.every((id) => allowedIds.has(id))) continue;
    if (anchorItemId && !uniqueIds.includes(String(anchorItemId))) continue;

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
  return {
    recommendationId: body.recommendationId,
    outfitItemIds: body.outfitItemIds.map(String),
    rating: body.rating,
    occasion: body.occasion,
    style: body.style,
  };
};
