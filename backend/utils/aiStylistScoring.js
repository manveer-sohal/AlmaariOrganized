import { effectiveFormalityScore } from "./normalizeClothingAnalysisResponse.js";

const NEUTRALS = ["black", "white", "beige", "grey", "gray", "navy", "brown"];

export const flattenColours = (item) => {
  if (!item?.colour) return [];
  return Array.isArray(item.colour) ? item.colour : [item.colour];
};

const isNeutral = (colour) =>
  NEUTRALS.some((n) => String(colour).toLowerCase().includes(n));

export const isDress = (item) => /dress/i.test(item?.type || "");

const matchesAvoid = (item, avoidText) => {
  if (!avoidText) return false;
  const haystack = [
    item.type,
    item.material,
    item.fit,
    item.pattern,
    ...flattenColours(item),
    ...(item.season || []),
  ]
    .join(" ")
    .toLowerCase();
  return avoidText
    .toLowerCase()
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .some((term) => haystack.includes(term));
};

const OCCASION_TAG_ALIASES = {
  Everyday: ["Everyday"],
  Work: ["Work"],
  Dinner: ["Going Out", "Event"],
  Party: ["Going Out", "Event"],
  Formal: ["Formal Event", "Work"],
  Other: [],
};

const occasionScore = (items, occasion) => {
  const map = {
    Everyday: ["t-shirt", "jeans", "hoodie", "sneakers", "shorts"],
    Work: ["blazer", "dress shirt", "trousers", "shirt", "blouse"],
    Dinner: ["blazer", "dress", "shirt", "blouse", "heels"],
    Party: ["dress", "blazer", "heels", "crop"],
    Formal: ["suit", "blazer", "dress shirt", "tie", "heels"],
    Other: [],
  };
  const keywords = map[occasion] || [];
  const wantedTags = OCCASION_TAG_ALIASES[occasion] || [];

  const tagHits = items.filter((item) => {
    const tags = item.stylingMetadata?.occasionTags || [];
    return tags.some((tag) => wantedTags.includes(tag));
  }).length;

  const userTagBoost = items.some(
    (item) =>
      item.stylingMetadata?.occasionTagsSource === "user" &&
      (item.stylingMetadata?.occasionTags || []).some((tag) =>
        wantedTags.includes(tag),
      ),
  )
    ? 0.1
    : 0;

  if (wantedTags.length > 0 && tagHits > 0) {
    return Math.min(1, 0.55 + tagHits * 0.15 + userTagBoost);
  }

  if (keywords.length === 0) return 0.7;
  const hits = items.filter((item) =>
    keywords.some((k) => item.type.toLowerCase().includes(k)),
  ).length;
  return Math.min(1, 0.45 + hits * 0.18);
};

const weatherScore = (items, weather) => {
  const warmTypes = ["shorts", "t-shirt", "tank", "sandals", "crop"];
  const coldTypes = ["coat", "jacket", "sweater", "hoodie", "boots", "scarf"];
  const scores = items.map((item) => {
    const type = item.type.toLowerCase();
    const seasons = (item.season || []).map((s) => s.toLowerCase());
    if (weather === "Warm") {
      if (warmTypes.some((t) => type.includes(t))) return 1;
      if (coldTypes.some((t) => type.includes(t))) return 0.2;
      if (seasons.includes("summer")) return 0.9;
      return 0.6;
    }
    if (weather === "Cold") {
      if (coldTypes.some((t) => type.includes(t))) return 1;
      if (warmTypes.some((t) => type.includes(t))) return 0.25;
      if (seasons.includes("winter") || seasons.includes("fall")) return 0.9;
      return 0.55;
    }
    return 0.75;
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
};

const STYLE_CATEGORY_ALIASES = {
  Casual: ["Casual"],
  "Smart casual": ["Smart Casual"],
  Minimal: ["Smart Casual", "Casual"],
  Streetwear: ["Casual", "Athletic"],
};

const styleScore = (items, style) => {
  const map = {
    Casual: ["hoodie", "jeans", "t-shirt", "shorts", "sneakers"],
    "Smart casual": ["blazer", "chino", "trousers", "shirt", "loafers"],
    Minimal: ["shirt", "trousers", "jeans", "coat"],
    Streetwear: ["hoodie", "cargos", "sneakers", "jacket", "cap"],
  };
  const wanted = STYLE_CATEGORY_ALIASES[style] || [];
  const categoryHits = items.filter((item) =>
    wanted.includes(item.stylingMetadata?.styleCategory),
  ).length;
  const userStyleBoost = items.some(
    (item) =>
      item.stylingMetadata?.styleCategorySource === "user" &&
      wanted.includes(item.stylingMetadata?.styleCategory),
  )
    ? 0.12
    : 0;
  if (wanted.length > 0 && categoryHits > 0) {
    return Math.min(1, 0.5 + categoryHits * 0.15 + userStyleBoost);
  }

  const keywords = map[style] || [];
  if (keywords.length === 0) return 0.7;
  const hits = items.filter((item) =>
    keywords.some((k) => item.type.toLowerCase().includes(k)),
  ).length;
  return Math.min(1, 0.4 + hits * 0.2);
};

export const colourCompatibility = (items) => {
  const colours = items.flatMap(flattenColours).map((c) => c.toLowerCase());
  const unique = [...new Set(colours)];
  const neutralCount = unique.filter(isNeutral).length;
  if (unique.length <= 2) return 0.95;
  if (unique.length === 3 && neutralCount >= 1) return 0.85;
  if (unique.length <= 4 && neutralCount >= 2) return 0.75;
  if (unique.length >= 5) return 0.35;
  return 0.6;
};

const formalityConsistency = (items) => {
  const scores = items
    .map((item) => effectiveFormalityScore(item))
    .filter((score) => typeof score === "number");

  if (scores.length >= 2) {
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const spread = max - min;
    if (spread <= 2) return 0.95;
    if (spread <= 4) return 0.7;
    return 0.4;
  }

  const formal = ["suit", "blazer", "dress shirt", "tie", "heels"];
  const casual = ["hoodie", "shorts", "sneakers", "tank", "cargos"];
  let formalHits = 0;
  let casualHits = 0;
  items.forEach((item) => {
    const type = item.type.toLowerCase();
    if (formal.some((f) => type.includes(f))) formalHits += 1;
    if (casual.some((c) => type.includes(c))) casualHits += 1;
  });
  if (formalHits > 0 && casualHits > 0) return 0.45;
  return 0.85;
};

/** Prefer at most one high-statement piece unless the look is intentionally bold. */
export const statementBalance = (items, preferences = {}) => {
  const levels = items
    .map((item) => item.stylingMetadata?.statementLevel)
    .filter((level) => typeof level === "number");
  if (levels.length === 0) return 0.75;

  const highStatement = levels.filter((level) => level >= 4).length;
  const boldRequested = /bold|statement|party|going out/i.test(
    `${preferences.style || ""} ${preferences.occasion || ""}`,
  );

  if (highStatement >= 2 && !boldRequested) return 0.25;
  if (highStatement === 1) return 0.9;
  return 0.8;
};

/**
 * Maps a preference profile onto an outfit. Empty/cold-start profiles
 * return a neutral 0.5 so ranking matches the baseline weights.
 */
export const preferenceMatch = (items, profile) => {
  if (!profile || profile.isEmpty) return 0.5;

  const {
    typeWeights = {},
    colourWeights = {},
    itemWeights = {},
  } = profile;

  if (
    !Object.keys(typeWeights).length &&
    !Object.keys(colourWeights).length &&
    !Object.keys(itemWeights).length
  ) {
    return 0.5;
  }

  const affinities = [];

  items.forEach((item) => {
    const itemId = item._id?.toString?.() || String(item._id || "");
    if (itemWeights[itemId] != null) {
      // Item-level signal is strongest (especially for downvoted pieces).
      affinities.push(itemWeights[itemId] * 1.25);
    }

    const typeKey = String(item.type || "").toLowerCase();
    if (typeWeights[typeKey] != null) {
      affinities.push(typeWeights[typeKey]);
    }

    flattenColours(item).forEach((colour) => {
      const colourKey = String(colour).toLowerCase();
      if (colourWeights[colourKey] != null) {
        affinities.push(colourWeights[colourKey]);
      }
    });
  });

  if (affinities.length === 0) return 0.5;

  const avg =
    affinities.reduce((sum, value) => sum + value, 0) / affinities.length;
  // Convert [-1, 1]-ish affinity into [0, 1] score.
  return Math.max(0, Math.min(1, 0.5 + avg * 0.5));
};

export const scoreOutfit = (items, preferences, profile) => {
  const { occasion = "Everyday", weather = "Mild", style = "Casual" } =
    preferences;

  return (
    colourCompatibility(items) * 0.2 +
    occasionScore(items, occasion) * 0.2 +
    weatherScore(items, weather) * 0.16 +
    formalityConsistency(items) * 0.12 +
    styleScore(items, style) * 0.08 +
    statementBalance(items, preferences) * 0.07 +
    preferenceMatch(items, profile) * 0.12 +
    0.05
  );
};

export const filterWardrobe = (items, preferences) => {
  const { avoid, anchorItem } = preferences;
  const avoidText = String(avoid || "").trim();

  return items.filter((item) => {
    if (anchorItem && item._id.toString() === anchorItem._id.toString()) {
      return true;
    }
    if (matchesAvoid(item, avoidText)) return false;
    return true;
  });
};

export const groupBySlot = (items) => {
  const bySlot = { head: [], body: [], legs: [], feet: [] };
  items.forEach((item) => {
    const slot = String(item.slot || "")
      .trim()
      .toLowerCase();
    if (bySlot[slot]) bySlot[slot].push(item);
  });
  return bySlot;
};

export const canFormOutfits = (bySlot) => {
  const hasShoes = (bySlot.feet?.length || 0) > 0;
  const hasDress = bySlot.body?.some(isDress);
  const hasTop = (bySlot.body?.length || 0) > 0;
  const hasBottom = (bySlot.legs?.length || 0) > 0;
  if (!hasShoes) return false;
  if (hasDress) return true;
  return hasTop && hasBottom;
};

/**
 * Build outfit combinations. Styling metadata is never required.
 * Ensures canFormOutfits and generation stay consistent when the wardrobe
 * is dress+shoes (no legs) or when an anchor sits outside the default slice.
 */
export const generateCandidateOutfits = (bySlot, anchorItem) => {
  const combos = [];

  let bodyItems = [...(bySlot.body || [])];
  let legItems = [...(bySlot.legs || [])];
  let feetItems = [...(bySlot.feet || [])];
  let headItems = [...(bySlot.head || [])];

  const prioritizeAnchor = (list, slot) => {
    if (!anchorItem) return list;
    const anchorSlot = String(anchorItem.slot || "")
      .trim()
      .toLowerCase();
    if (anchorSlot !== slot) return list;
    const id = anchorItem._id.toString();
    const without = list.filter((item) => item._id.toString() !== id);
    const found = list.find((item) => item._id.toString() === id);
    if (found) return [found, ...without];
    return [anchorItem, ...list];
  };

  bodyItems = prioritizeAnchor(bodyItems, "body");
  legItems = prioritizeAnchor(legItems, "legs");
  feetItems = prioritizeAnchor(feetItems, "feet");
  headItems = prioritizeAnchor(headItems, "head");

  // When there are no bottoms, dresses must be considered first or generation
  // yields zero combos even though canFormOutfits is true.
  if (legItems.length === 0) {
    const dresses = bodyItems.filter(isDress);
    const nonDresses = bodyItems.filter((item) => !isDress(item));
    bodyItems = [...dresses, ...nonDresses];
  }

  bodyItems = bodyItems.slice(0, 10);
  legItems = legItems.slice(0, 10);
  feetItems = feetItems.slice(0, 8);
  headItems = [null, ...headItems.slice(0, 4)];

  for (const body of bodyItems) {
    const legChoices = isDress(body)
      ? [null]
      : legItems.length > 0
        ? legItems
        : [];
    if (legChoices.length === 0) continue;

    for (const legs of legChoices) {
      for (const feet of feetItems) {
        for (const head of headItems) {
          const items = [body, legs, feet, head].filter(Boolean);
          if (items.length < 2) continue;
          if (
            anchorItem &&
            !items.some((i) => i._id.toString() === anchorItem._id.toString())
          ) {
            continue;
          }
          combos.push(items);
          if (combos.length >= 60) return combos;
        }
      }
    }
  }

  return combos;
};

export const outfitSignature = (items) =>
  items
    .map((i) => i._id.toString())
    .sort()
    .join("|");

export const pickDiverseOutfits = (
  scoredCandidates,
  count = 3,
  excludedSignatures = [],
) => {
  const selected = [];
  const usedSignatures = new Set();
  const blocked = new Set(excludedSignatures || []);

  for (const candidate of scoredCandidates) {
    const signature = outfitSignature(candidate.items);
    if (usedSignatures.has(signature)) continue;
    if (blocked.has(signature)) continue;

    const overlapsTooMuch = selected.some((existing) => {
      const existingIds = new Set(
        existing.items.map((i) => i._id.toString()),
      );
      const overlap = candidate.items.filter((i) =>
        existingIds.has(i._id.toString()),
      ).length;
      return overlap >= candidate.items.length - 1;
    });
    if (overlapsTooMuch && selected.length > 0) continue;

    selected.push(candidate);
    usedSignatures.add(signature);
    if (selected.length >= count) break;
  }

  // If exclusions left us short, fill from remaining non-blocked candidates first.
  if (selected.length < count) {
    for (const candidate of scoredCandidates) {
      if (selected.length >= count) break;
      const signature = outfitSignature(candidate.items);
      if (usedSignatures.has(signature) || blocked.has(signature)) continue;
      selected.push(candidate);
      usedSignatures.add(signature);
    }
  }

  // Last resort: only then allow previously blocked signatures so we still
  // return `count` outfits when the wardrobe is tiny.
  if (selected.length < count) {
    for (const candidate of scoredCandidates) {
      if (selected.length >= count) break;
      const signature = outfitSignature(candidate.items);
      if (usedSignatures.has(signature)) continue;
      selected.push(candidate);
      usedSignatures.add(signature);
    }
  }

  return selected;
};

export const buildExplanation = (items, label, preferences) => {
  const types = items.map((i) => i.type).join(", ");
  const colours = [
    ...new Set(items.flatMap(flattenColours).filter(Boolean)),
  ].slice(0, 3);
  const colourText = colours.length ? colours.join(" and ") : "neutral tones";
  const occasion = preferences.occasion || "Everyday";

  if (label === "Safe Choice") {
    return `A reliable ${occasion.toLowerCase()} look built from your ${types.toLowerCase()} with balanced ${colourText.toLowerCase()}.`;
  }
  if (label === "Styled Choice") {
    return `This combination leans into your ${preferences.style?.toLowerCase() || "casual"} preference while keeping ${colourText.toLowerCase()} cohesive.`;
  }
  return `An alternative mix from your wardrobe that still fits ${occasion.toLowerCase()} without repeating your safer picks.`;
};
