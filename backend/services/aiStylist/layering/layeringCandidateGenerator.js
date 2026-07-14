import { logInfo } from "../../../observability/logger.js";
import {
  getLayeringMetadata,
  isDress,
  itemId,
  resolveLayerRoles,
} from "./layerRoles.js";
import {
  scoreLayerCombination,
  validateLayerCombination,
} from "./layeringRules.js";
import { resolveRequiredLayerInterpretations } from "./layeringResolver.js";
import { resolveBaseLayerRequirement } from "./topSubtypeResolver.js";

const BASE_POOL = 12;
const MID_POOL = 8;
const OUTER_POOL = 6;
const NECK_POOL = 4;
const MAX_UPPER = 40;

const poolByRole = (wardrobe, role) =>
  wardrobe
    .filter((item) => resolveLayerRoles(item).includes(role))
    .slice(
      0,
      role === "base_top"
        ? BASE_POOL
        : role === "mid_layer"
          ? MID_POOL
          : role === "outer_layer"
            ? OUTER_POOL
            : NECK_POOL,
    );

/**
 * Generate valid layered upper-body structures from wardrobe + required items.
 * Mid/outer layers always get a compatible base top when available.
 */
export const generateLayerCombinations = ({
  wardrobe = [],
  requiredItems = [],
  preferences = {},
  mode = "random",
  generationId = null,
}) => {
  const start = Date.now();
  let rejectedCount = 0;
  const rejectionReasons = {};

  const reject = (reason) => {
    rejectedCount += 1;
    rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
  };

  const { plans, lower, feet, otherHead } =
    resolveRequiredLayerInterpretations(requiredItems);

  const requiredUpper = requiredItems.filter((item) => {
    const slot = String(item.slot || "").toLowerCase();
    const meta = getLayeringMetadata(item);
    return (
      isDress(item) ||
      meta.layerRoles.includes("neckwear") ||
      meta.layerRoles.some((r) =>
        ["base_top", "mid_layer", "outer_layer"].includes(r),
      ) ||
      slot === "body"
    );
  });

  if (requiredUpper.length > 0 && plans.length === 0) {
    logInfo("stylist.layering.roles_resolved", {
      workflow: "outfit_recommendation",
      generationId,
      requiredItemIds: requiredItems.map(itemId),
      planCount: 0,
      conflict: true,
    });
    return {
      combinations: [],
      lower,
      feet,
      otherHead,
      stats: {
        combinationCount: 0,
        rejectedCount: 1,
        rejectionReasons: { role_conflict: 1 },
        durationMs: Date.now() - start,
      },
      conflictError:
        "Selected upper-body pieces cannot be layered together (conflicting roles).",
    };
  }

  logInfo("stylist.layering.roles_resolved", {
    workflow: "outfit_recommendation",
    generationId,
    requiredItemIds: requiredItems.map(itemId),
    planCount: plans.length || 1,
  });

  const basePool = poolByRole(wardrobe, "base_top");
  const midPool = poolByRole(wardrobe, "mid_layer");
  const outerPool = poolByRole(wardrobe, "outer_layer");
  const neckPool = poolByRole(wardrobe, "neckwear");

  const weather = preferences.weather || "Mild";
  const preferLayers =
    weather === "Cold" || /Formal|Work|Dinner/.test(preferences.occasion || "");
  const lightLayers = weather === "Warm";

  const interpretations =
    plans.length > 0
      ? plans
      : [
          {
            baseTop: null,
            midLayer: null,
            outerLayer: null,
            neckwear: null,
            dress: null,
          },
        ];

  // Improve mode: don't reinterpret a wearable base (shirt/button-up) as mid
  // just to slide another top underneath — keep it as base and add layers on top.
  // Mid-only pieces (sweater, hoodie) still allow optional base underneath.
  const normalizedInterpretations = interpretations.map((plan) => {
    if (
      mode === "improve" &&
      plan.midLayer &&
      !plan.baseTop &&
      resolveLayerRoles(plan.midLayer).includes("base_top")
    ) {
      return { ...plan, baseTop: plan.midLayer, midLayer: null };
    }
    return plan;
  });

  const combinations = [];
  const seen = new Set();

  const pushCombo = (structure) => {
    const ids = [
      structure.dress,
      structure.baseTop,
      structure.midLayer,
      structure.outerLayer,
      structure.neckwear,
    ]
      .filter(Boolean)
      .map(itemId)
      .sort()
      .join("|");
    if (seen.has(ids)) return;
    const scored = scoreLayerCombination({
      ...structure,
      preferences,
      generationId,
    });
    if (scored.rejected) {
      reject(scored.reason || "invalid");
      logInfo("stylist.layering.combination_rejected", {
        workflow: "outfit_recommendation",
        generationId,
        reason: scored.reason,
      });
      return;
    }
    seen.add(ids);
    combinations.push({
      ...structure,
      wearState: scored.wearState,
      layeringScore: scored,
    });
  };

  for (const plan of normalizedInterpretations) {
    if (plan.dress) {
      pushCombo({
        dress: plan.dress,
        baseTop: null,
        midLayer: null,
        outerLayer: null,
        neckwear: plan.neckwear,
      });
      continue;
    }

    const lockedNeedsBase =
      (plan.midLayer || plan.outerLayer) && !plan.baseTop;

    let baseChoices;
    if (plan.baseTop) {
      baseChoices = [plan.baseTop];
    } else if (lockedNeedsBase) {
      // Required mid/outer without base → force a base from the pool (no null)
      const requirement = resolveBaseLayerRequirement(
        plan.midLayer || plan.outerLayer,
      );
      const pool = basePool.filter(
        (b) =>
          itemId(b) !== itemId(plan.midLayer) &&
          itemId(b) !== itemId(plan.outerLayer),
      );
      if (pool.length === 0) {
        reject("no_compatible_base_top");
        logInfo("stylist.layering.base_required", {
          workflow: "outfit_recommendation",
          generationId,
          reason: "no_compatible_base_top",
          requirement,
        });
        continue;
      }
      baseChoices = pool;
      logInfo("stylist.layering.base_added", {
        workflow: "outfit_recommendation",
        generationId,
        requirement,
        baseCandidateCount: pool.length,
      });
    } else {
      baseChoices =
        preferLayers || mode !== "random"
          ? [null, ...basePool]
          : [null, ...basePool.slice(0, 6)];
    }

    for (const baseTop of baseChoices.slice(0, BASE_POOL + 1)) {
      if (plan.baseTop && baseTop && itemId(baseTop) !== itemId(plan.baseTop))
        continue;

      const midChoices = plan.midLayer
        ? [plan.midLayer]
        : lightLayers
          ? [null, ...midPool.slice(0, 3)]
          : [null, ...midPool];

      for (const midLayer of midChoices.slice(0, MID_POOL + 1)) {
        if (midLayer && baseTop && itemId(midLayer) === itemId(baseTop))
          continue;

        const outerChoices = plan.outerLayer
          ? [plan.outerLayer]
          : preferLayers
            ? [null, ...outerPool]
            : [null, ...outerPool.slice(0, 3)];

        for (const outerLayer of outerChoices.slice(0, OUTER_POOL + 1)) {
          if (
            outerLayer &&
            ((baseTop && itemId(outerLayer) === itemId(baseTop)) ||
              (midLayer && itemId(outerLayer) === itemId(midLayer)))
          ) {
            continue;
          }

          if ((midLayer || outerLayer) && !baseTop) {
            reject("missing_base_top");
            continue;
          }

          const neckChoices = plan.neckwear
            ? [plan.neckwear]
            : [null, ...neckPool];

          for (const neckwear of neckChoices.slice(0, NECK_POOL + 1)) {
            if (!baseTop && !midLayer && !outerLayer) continue;

            const validation = validateLayerCombination({
              baseTop,
              midLayer,
              outerLayer,
              neckwear,
              preferences,
              generationId,
            });
            if (!validation.ok) {
              reject(validation.reason || "invalid");
              continue;
            }

            pushCombo({
              dress: null,
              baseTop,
              midLayer,
              outerLayer,
              neckwear,
            });

            if (combinations.length >= MAX_UPPER) break;
          }
          if (combinations.length >= MAX_UPPER) break;
        }
        if (combinations.length >= MAX_UPPER) break;
      }
      if (combinations.length >= MAX_UPPER) break;
    }
  }

  const durationMs = Date.now() - start;
  logInfo("stylist.layering.combinations_generated", {
    workflow: "outfit_recommendation",
    generationId,
    combinationCount: combinations.length,
    rejectedCount,
    rejectionReasons,
    durationMs,
    baseTopCount: combinations.filter((c) => c.baseTop).length,
    midLayerCount: combinations.filter((c) => c.midLayer).length,
    outerLayerCount: combinations.filter((c) => c.outerLayer).length,
    neckwearCount: combinations.filter((c) => c.neckwear).length,
  });

  logInfo("stylist.layering.completed", {
    workflow: "outfit_recommendation",
    generationId,
    combinationCount: combinations.length,
    rejectedCount,
    durationMs,
  });

  return {
    combinations,
    lower,
    feet,
    otherHead,
    stats: {
      combinationCount: combinations.length,
      rejectedCount,
      rejectionReasons,
      durationMs,
    },
    conflictError: null,
  };
};

/** Flatten layered upper structure to clothing items (base → mid → outer → neck). */
export const flattenLayerStructure = (structure) => {
  if (structure.dress) {
    return [structure.dress, structure.neckwear].filter(Boolean);
  }
  return [
    structure.baseTop,
    structure.midLayer,
    structure.outerLayer,
    structure.neckwear,
  ].filter(Boolean);
};

export const buildLayeredPayload = (structure) => ({
  baseTopId: structure.baseTop ? itemId(structure.baseTop) : undefined,
  midLayerId: structure.midLayer ? itemId(structure.midLayer) : undefined,
  outerLayerId: structure.outerLayer ? itemId(structure.outerLayer) : undefined,
  neckwearId: structure.neckwear ? itemId(structure.neckwear) : undefined,
  dressId: structure.dress ? itemId(structure.dress) : undefined,
  wearState: structure.wearState || {},
});
