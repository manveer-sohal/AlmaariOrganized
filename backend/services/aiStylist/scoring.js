/**
 * Central scoring weights — do not scatter magic numbers elsewhere.
 * Sum of weighted components (excluding constant floor) should stay near 1.
 */
export const STYLIST_WEIGHTS = {
  colourHarmony: 0.18,
  occasion: 0.18,
  weather: 0.14,
  formality: 0.1,
  styleMatch: 0.07,
  statementBalance: 0.06,
  preferenceMatch: 0.1,
  completeness: 0.05,
  novelty: 0.05,
  layering: 0.07,
  constant: 0.05,
};

/** Exact duplicate threshold / high-overlap penalty (shared item count). */
export const NOVELTY_CONFIG = {
  exactDuplicateReject: true,
  highOverlapPenaltyItems: 1, // overlap >= length - 1 → heavy penalty in diversity picker
  similaritySoftPenalty: 0.35,
};

export const signaturesToIdSets = (signatures = []) =>
  signatures
    .map((sig) =>
      String(sig)
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .filter((ids) => ids.length > 0);

/**
 * Novelty in [0,1]: 1 = fully new vs prior generations, 0 = exact duplicate.
 */
export const noveltyScore = (items, priorSignatures = []) => {
  if (!priorSignatures.length) return 1;
  const ids = new Set(items.map((i) => i._id.toString()));
  const priorSets = signaturesToIdSets(priorSignatures);
  let bestOverlapRatio = 0;
  let exactDup = false;

  for (const prior of priorSets) {
    const priorSet = new Set(prior);
    if (
      priorSet.size === ids.size &&
      [...ids].every((id) => priorSet.has(id))
    ) {
      exactDup = true;
      break;
    }
    let overlap = 0;
    for (const id of ids) {
      if (priorSet.has(id)) overlap += 1;
    }
    const ratio = overlap / Math.max(ids.size, priorSet.size, 1);
    bestOverlapRatio = Math.max(bestOverlapRatio, ratio);
  }

  if (exactDup) return 0;
  return Math.max(0, 1 - bestOverlapRatio);
};

export const refinementBoost = (items, refinementPrompt = "") => {
  const text = String(refinementPrompt || "")
    .toLowerCase()
    .trim();
  if (!text) return 0;

  const haystack = items
    .map((item) =>
      [
        item.type,
        item.material,
        item.fit,
        item.pattern,
        ...(Array.isArray(item.colour) ? item.colour : [item.colour]),
        ...(item.season || []),
        item.stylingMetadata?.styleCategory,
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ")
    .toLowerCase();

  let boost = 0;
  if (/casual|relaxed|everyday/.test(text) && /hoodie|jeans|t-shirt|sneaker/.test(haystack))
    boost += 0.08;
  if (/formal|dressy|elegant|dinner/.test(text) && /blazer|dress|heel|suit|shirt/.test(haystack))
    boost += 0.08;
  if (/dark|black|navy|deeper/.test(text) && /black|navy|charcoal|grey|gray/.test(haystack))
    boost += 0.06;
  if (/warm|cold|winter|summer|layer/.test(text)) {
    if (/warm|summer/.test(text) && /short|sandal|tank|t-shirt/.test(haystack))
      boost += 0.05;
    if (/cold|winter|warmer|layer/.test(text) && /coat|jacket|sweater|boot|scarf/.test(haystack))
      boost += 0.05;
  }
  if (/bold|statement|party/.test(text)) boost += 0.03;
  if (/simple|minimal|cleaner/.test(text) && /plain|solid|minimal/.test(haystack))
    boost += 0.04;
  return Math.min(0.15, boost);
};
