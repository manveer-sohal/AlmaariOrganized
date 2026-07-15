import { logInfo } from "../../observability/logger.js";
import { sanitizeRecommendationLayering } from "./layering/layeringValidator.js";

const LABELS = ["Safe Choice", "Styled Choice", "Alternative"];

const hasRequiredItems = (itemIds, requiredItemIds = []) => {
  if (!requiredItemIds || requiredItemIds.length === 0) return true;
  const set = new Set(itemIds.map(String));
  return requiredItemIds.every((id) => set.has(String(id)));
};

/**
 * Strict validation of recommendation payloads.
 * Rejects invented IDs, missing required items, duplicates, and bad labels.
 * Normalizes illegal wearState "open" on non-openable garments.
 */
export const validateOutfitRecommendations = ({
  recommendations,
  allowedIds,
  requiredItemIds = [],
  generationId = null,
  mode = null,
  wardrobeById = null,
}) => {
  const seenSignatures = new Set();
  const cleaned = [];
  const failures = [];

  for (const rec of recommendations || []) {
    const candidateId = rec.id || rec.label || "unknown";

    if (!LABELS.includes(rec.label)) {
      failures.push({ candidateId, reason: "invalid_label" });
      continue;
    }
    if (!Array.isArray(rec.itemIds) || rec.itemIds.length === 0) {
      failures.push({ candidateId, reason: "empty_item_ids" });
      continue;
    }

    const uniqueIds = [...new Set(rec.itemIds.map(String))];
    if (uniqueIds.length !== rec.itemIds.length) {
      failures.push({ candidateId, reason: "duplicate_ids" });
      continue;
    }
    if (!uniqueIds.every((id) => allowedIds.has(id))) {
      failures.push({ candidateId, reason: "unknown_wardrobe_id" });
      continue;
    }
    if (!hasRequiredItems(uniqueIds, requiredItemIds)) {
      failures.push({ candidateId, reason: "missing_required_items" });
      continue;
    }

    const signature = [...uniqueIds].sort().join("|");
    if (seenSignatures.has(signature)) {
      failures.push({ candidateId, reason: "duplicate_signature" });
      continue;
    }
    seenSignatures.add(signature);

    let layering;
    if (rec.layering && typeof rec.layering === "object") {
      const layerIds = [
        rec.layering.baseTopId,
        rec.layering.midLayerId,
        rec.layering.outerLayerId,
        rec.layering.neckwearId,
        rec.layering.waistAccessoryId,
      ]
        .filter(Boolean)
        .map(String);
      const idSet = new Set(uniqueIds);
      if (layerIds.every((id) => idSet.has(id))) {
        layering = rec.layering;
      } else {
        failures.push({ candidateId, reason: "invalid_layering_ids" });
        layering = undefined;
      }
    }

    let cleanedRec = {
      id: rec.id || `${rec.label}-${signature}`,
      label: rec.label,
      name: rec.name || rec.label,
      itemIds: uniqueIds,
      explanation: String(rec.explanation || "").slice(0, 400),
      confidence:
        typeof rec.confidence === "number"
          ? Math.max(0, Math.min(1, rec.confidence))
          : undefined,
      layering,
    };

    if (cleanedRec.layering && wardrobeById) {
      cleanedRec = sanitizeRecommendationLayering({
        recommendation: cleanedRec,
        itemsById: wardrobeById,
        generationId,
      });
    }

    cleaned.push(cleanedRec);
  }

  for (const failure of failures) {
    logInfo("stylist.validation_failed", {
      workflow: "outfit_recommendation",
      generationId,
      mode,
      candidateId: failure.candidateId,
      reason: failure.reason,
      itemId: failure.itemId,
      itemType: failure.itemType,
      normalizedSubtype: failure.normalizedSubtype,
    });
  }

  return cleaned.slice(0, 3);
};
