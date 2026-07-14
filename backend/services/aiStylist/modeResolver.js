export const STYLIST_MODES = ["random", "complete", "improve", "selected"];

const uniqueIds = (ids = []) =>
  [...new Set((Array.isArray(ids) ? ids : []).map(String).filter(Boolean))];

/**
 * Resolve explicit mode + required item IDs.
 * Legacy `anchorItemId` maps to Style Selected Items with one required ID.
 */
export const resolveStylistMode = (parsed) => {
  const requiredFromBody = uniqueIds(parsed.requiredItemIds);
  const previewIds = uniqueIds(parsed.previewItemIds);
  const legacyAnchor =
    parsed.anchorItemId != null ? String(parsed.anchorItemId) : null;

  let mode =
    parsed.mode && STYLIST_MODES.includes(parsed.mode) ? parsed.mode : null;

  // Legacy single-anchor clients → selected mode
  if (!mode && legacyAnchor) {
    mode = "selected";
  }

  // Fallback inference when mode omitted
  if (!mode) {
    if (requiredFromBody.length > 0) mode = "selected";
    else if (previewIds.length > 0) mode = "complete";
    else mode = "random";
  }

  let requiredItemIds = [];
  if (mode === "complete" || mode === "improve") {
    requiredItemIds = previewIds.length > 0 ? previewIds : requiredFromBody;
  } else if (mode === "selected") {
    requiredItemIds =
      requiredFromBody.length > 0
        ? requiredFromBody
        : legacyAnchor
          ? [legacyAnchor]
          : [];
  } else {
    // random: optional required if user explicitly passed selection
    requiredItemIds =
      requiredFromBody.length > 0
        ? requiredFromBody
        : legacyAnchor
          ? [legacyAnchor]
          : [];
  }

  return {
    mode,
    requiredItemIds: uniqueIds(requiredItemIds),
    previewItemIds: previewIds,
    refinementPrompt:
      typeof parsed.refinementPrompt === "string"
        ? parsed.refinementPrompt.trim()
        : "",
    parentGenerationId: parsed.parentGenerationId || null,
    priorOutfitSignatures: Array.isArray(parsed.priorOutfitSignatures)
      ? parsed.priorOutfitSignatures.map(String)
      : [],
  };
};

export const validateModeRequirements = (resolved) => {
  const { mode, requiredItemIds } = resolved;

  if (mode === "complete" && requiredItemIds.length === 0) {
    return {
      code: "EMPTY_PREVIEW",
      message: "Add at least one item to your outfit preview first.",
    };
  }
  if (mode === "improve" && requiredItemIds.length === 0) {
    return {
      code: "EMPTY_PREVIEW",
      message: "Build an outfit first, then ask Almaari to improve it.",
    };
  }
  if (mode === "selected" && requiredItemIds.length === 0) {
    return {
      code: "EMPTY_SELECTION",
      message: "Select one or more wardrobe items to style.",
    };
  }
  return null;
};
