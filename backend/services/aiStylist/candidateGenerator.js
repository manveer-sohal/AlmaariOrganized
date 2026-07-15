import {
  generateLayerCombinations,
  flattenLayerStructure,
  buildLayeredPayload,
} from "./layering/layeringCandidateGenerator.js";
import { itemId as layerItemId, isDress } from "./layering/layerRoles.js";
import {
  isBeltType,
  bottomSupportsBelt,
  scoreBeltCompatibility,
  BELT_POOL,
} from "./layering/beltResolver.js";
import { logInfo } from "../../observability/logger.js";

const MAX_COMBOS = 100;
const LEGS_POOL = 12;
const FEET_POOL = 10;
const HEAD_POOL = 6;

const itemId = (item) => item._id.toString();

const lockRequired = (list, requiredItem, poolSize) => {
  if (!requiredItem) {
    return list.slice(0, poolSize);
  }
  const id = itemId(requiredItem);
  const without = list.filter((item) => itemId(item) !== id);
  const found = list.find((item) => itemId(item) === id);
  const locked = found || requiredItem;
  return [locked, ...without].slice(0, Math.max(poolSize, 1));
};

const containsAllRequired = (items, requiredItemIds) => {
  if (!requiredItemIds || requiredItemIds.size === 0) return true;
  const ids = new Set(items.map(itemId));
  for (const id of requiredItemIds) {
    if (!ids.has(id)) return false;
  }
  return true;
};

const isGenericAccessory = (item) => {
  if (isBeltType(item)) return false;
  const t = String(item?.type || "").toLowerCase();
  return !/^(tie|bow\s*tie)$|necktie|bowtie/.test(t);
};

/**
 * Deterministic candidate generation with multi-required locks + layering + belts.
 * Returns array of { items, layering } (items also kept as flat list for scoring).
 */
export const generateConstrainedCandidates = (bySlot, constraints) => {
  const requiredBySlot = constraints.requiredBySlot || {};
  const requiredItemIds = constraints.requiredItemIds || new Set();
  const requiredItems = constraints.requiredItems || [];
  const mode = constraints.mode || "random";
  const preferences = {
    occasion: constraints.occasion,
    weather: constraints.weather,
    style: constraints.style,
  };
  const generationId = constraints.generationId || null;

  let legItems = [...(bySlot.legs || [])];
  let feetItems = [...(bySlot.feet || [])];
  const allHead = [...(bySlot.head || [])];
  let headItems = allHead.filter(isGenericAccessory);
  let beltItems = allHead.filter(isBeltType);

  // Belts may also live on body/legs in legacy data
  for (const item of [...(bySlot.body || []), ...(bySlot.legs || [])]) {
    if (isBeltType(item) && !beltItems.some((b) => itemId(b) === itemId(item))) {
      beltItems.push(item);
    }
  }

  const requiredBelt = requiredItems.find(isBeltType) || null;
  if (requiredBelt) {
    beltItems = [
      requiredBelt,
      ...beltItems.filter((b) => itemId(b) !== itemId(requiredBelt)),
    ];
  }

  const excluded = constraints.excludedItemIds || new Set();
  const keep = (item) =>
    !excluded.has(itemId(item)) || requiredItemIds.has(itemId(item));
  legItems = legItems.filter(keep);
  feetItems = feetItems.filter(keep);
  headItems = headItems.filter(keep);
  beltItems = beltItems.filter(keep).slice(0, BELT_POOL);

  legItems = lockRequired(legItems, requiredBySlot.legs, LEGS_POOL);
  feetItems = lockRequired(feetItems, requiredBySlot.feet, FEET_POOL);
  headItems = lockRequired(headItems, requiredBySlot.head, HEAD_POOL);

  if (requiredBySlot.legs) legItems = [requiredBySlot.legs];
  if (requiredBySlot.feet) feetItems = [requiredBySlot.feet];

  // Required belt → only bottoms that support belts
  if (requiredBelt) {
    const before = legItems.length;
    legItems = legItems.filter(bottomSupportsBelt);
    if (legItems.length === 0 && before > 0) {
      logInfo("stylist.belt.candidate_rejected", {
        workflow: "outfit_recommendation",
        generationId,
        beltItemId: itemId(requiredBelt),
        reason: "no_compatible_bottoms",
      });
    }
  }

  const wardrobe = [
    ...(bySlot.body || []),
    ...(bySlot.head || []),
    ...(bySlot.legs || []),
    ...(bySlot.feet || []),
  ].filter(keep);

  const layered = generateLayerCombinations({
    wardrobe,
    requiredItems: requiredItems.filter((i) => !isBeltType(i)),
    preferences,
    mode,
    generationId,
  });

  if (layered.conflictError) {
    const err = new Error(layered.conflictError);
    err.code = "LAYERING_CONFLICT";
    err.status = 400;
    throw err;
  }

  const combos = [];
  const upperCombos = layered.combinations;

  const bodyFallback = (() => {
    if (upperCombos.length > 0) return [];
    let bodyItems = [...(bySlot.body || [])].filter(keep);
    if (legItems.length === 0 && !requiredBySlot.body) {
      const dresses = bodyItems.filter(isDress);
      const nonDresses = bodyItems.filter((item) => !isDress(item));
      bodyItems = [...dresses, ...nonDresses];
    }
    if (requiredBySlot.body) bodyItems = [requiredBySlot.body];
    else bodyItems = bodyItems.slice(0, 12);
    return bodyItems.map((body) => ({
      dress: isDress(body) ? body : null,
      baseTop: isDress(body) ? null : body,
      midLayer: null,
      outerLayer: null,
      neckwear: null,
      wearState: { [itemId(body)]: "standard" },
      layeringScore: { total: 0.5 },
    }));
  })();

  const uppers = upperCombos.length > 0 ? upperCombos : bodyFallback;

  const headChoices = requiredBySlot.head && !isBeltType(requiredBySlot.head)
    ? [requiredBySlot.head]
    : [null, ...headItems.slice(0, HEAD_POOL)];

  // Optional belt: required → locked; else null + a few belts
  const beltChoices = requiredBelt
    ? [requiredBelt]
    : [null, ...beltItems.slice(0, 2)];

  for (const upper of uppers) {
    const upperItems = flattenLayerStructure(upper);
    const dressPath = Boolean(upper.dress);

    const legChoices = dressPath
      ? [null]
      : requiredBySlot.legs
        ? [requiredBySlot.legs]
        : legItems.length > 0
          ? legItems
          : [];
    if (!dressPath && legChoices.length === 0) continue;
    if (!feetItems.length) continue;

    for (const legs of legChoices) {
      for (const feet of feetItems) {
        for (const head of headChoices) {
          if (
            head &&
            upper.neckwear &&
            itemId(head) === itemId(upper.neckwear)
          ) {
            continue;
          }

          for (const belt of beltChoices) {
            if (belt && legs && !bottomSupportsBelt(legs)) {
              logInfo("stylist.belt.candidate_rejected", {
                workflow: "outfit_recommendation",
                generationId,
                beltItemId: itemId(belt),
                bottomItemId: itemId(legs),
                reason: "bottom_rejects_belt",
              });
              continue;
            }
            if (belt && !legs) continue;

            let beltScoreBoost = 0;
            if (belt && legs) {
              const scored = scoreBeltCompatibility({
                belt,
                bottom: legs,
                shoes: feet,
                preferences,
              });
              if (!scored.compatible) continue;
              beltScoreBoost = scored.total * 0.05;
            }

            const items = [...upperItems, legs, feet, head, belt].filter(
              Boolean,
            );
            if (items.length < 2) continue;
            if (!containsAllRequired(items, requiredItemIds)) continue;

            const layering = buildLayeredPayload(upper);
            if (belt) {
              layering.waistAccessoryId = itemId(belt);
            }

            const layeringScore = upper.layeringScore
              ? {
                  ...upper.layeringScore,
                  total: Math.min(
                    1,
                    (upper.layeringScore.total || 0) + beltScoreBoost,
                  ),
                }
              : upper.layeringScore;

            combos.push({
              items,
              layering,
              layeringScore,
            });
            if (combos.length >= MAX_COMBOS) return combos;
          }
        }
      }
    }
  }

  return combos;
};

/**
 * Backward-compatible wrapper used by existing tests — returns item arrays only.
 */
export const generateCandidateOutfits = (bySlot, anchorItem) => {
  const requiredItems = anchorItem ? [anchorItem] : [];
  const requiredItemIds = new Set(requiredItems.map(itemId));
  const requiredBySlot = {};
  for (const item of requiredItems) {
    const slot = String(item.slot || "")
      .trim()
      .toLowerCase();
    requiredBySlot[slot] = item;
  }
  const combos = generateConstrainedCandidates(bySlot, {
    mode: anchorItem ? "selected" : "random",
    requiredItemIds,
    requiredBySlot,
    requiredItems,
    excludedItemIds: new Set(),
  });
  return combos.map((c) => (Array.isArray(c) ? c : c.items));
};

export { layerItemId };
