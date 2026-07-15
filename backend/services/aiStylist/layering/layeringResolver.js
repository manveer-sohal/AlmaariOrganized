import {
  getLayeringMetadata,
  isDress,
  itemId,
  resolveLayerRoles,
} from "./layerRoles.js";

/**
 * Assign required upper-body items to layer-role interpretations.
 * Returns one or more assignment plans (button-up as base vs mid, etc.).
 */
export const resolveRequiredLayerInterpretations = (requiredItems = []) => {
  const upper = [];
  const lower = [];
  const feet = [];
  const otherHead = [];

  for (const item of requiredItems) {
    const slot = String(item.slot || "")
      .trim()
      .toLowerCase();
    const meta = getLayeringMetadata(item);
    if (isDress(item)) {
      upper.push({ item, roles: ["none"], dress: true });
      continue;
    }
    if (meta.layerRoles.includes("neckwear")) {
      upper.push({ item, roles: ["neckwear"] });
      continue;
    }
    if (slot === "legs") {
      lower.push(item);
      continue;
    }
    if (slot === "feet") {
      feet.push(item);
      continue;
    }
    if (
      meta.layerRoles.some((r) =>
        ["base_top", "mid_layer", "outer_layer"].includes(r),
      )
    ) {
      upper.push({ item, roles: resolveLayerRoles(item) });
      continue;
    }
    if (slot === "head") {
      otherHead.push(item);
      continue;
    }
    if (slot === "body") {
      upper.push({ item, roles: resolveLayerRoles(item) });
    }
  }

  // Expand role assignment permutations for multi-role items
  const plans = expandRoleAssignments(upper);
  return { plans, lower, feet, otherHead };
};

const expandRoleAssignments = (upperEntries) => {
  if (upperEntries.length === 0) {
    return [{ baseTop: null, midLayer: null, outerLayer: null, neckwear: null, dress: null }];
  }

  const dressEntry = upperEntries.find((e) => e.dress);
  if (dressEntry) {
    const neck = upperEntries.find((e) => e.roles.includes("neckwear"));
    return [
      {
        baseTop: null,
        midLayer: null,
        outerLayer: null,
        neckwear: neck?.item || null,
        dress: dressEntry.item,
      },
    ];
  }

  // Backtracking assignment
  const results = [];
  const items = upperEntries.filter((e) => !e.dress);

  const assign = (index, usedRoles, current) => {
    if (index >= items.length) {
      results.push({ ...current });
      return;
    }
    const { item, roles } = items[index];
    for (const role of roles) {
      if (role === "none") continue;
      if (usedRoles.has(role)) continue;
      const next = { ...current };
      if (role === "base_top") next.baseTop = item;
      if (role === "mid_layer") next.midLayer = item;
      if (role === "outer_layer") next.outerLayer = item;
      if (role === "neckwear") next.neckwear = item;
      usedRoles.add(role);
      assign(index + 1, usedRoles, next);
      usedRoles.delete(role);
    }
  };

  assign(
    0,
    new Set(),
    { baseTop: null, midLayer: null, outerLayer: null, neckwear: null, dress: null },
  );

  // Deduplicate by item-role signature
  const seen = new Set();
  return results.filter((plan) => {
    const sig = [
      plan.baseTop && `b:${itemId(plan.baseTop)}`,
      plan.midLayer && `m:${itemId(plan.midLayer)}`,
      plan.outerLayer && `o:${itemId(plan.outerLayer)}`,
      plan.neckwear && `n:${itemId(plan.neckwear)}`,
    ]
      .filter(Boolean)
      .join("|");
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
};
