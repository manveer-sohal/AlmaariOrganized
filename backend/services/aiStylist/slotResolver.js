import { getLayeringMetadata, isDress } from "./layering/layerRoles.js";
import { isBeltType } from "./layering/beltResolver.js";

const SLOTS = ["head", "body", "legs", "feet"];

/**
 * Resolve occupied slots, dress path, and missing slots from required items.
 * Multiple body items are allowed when they map to different layer roles.
 * Belts are waist accessories and do not occupy the legs slot alone.
 */
export const resolveSlots = ({ requiredItems, mode }) => {
  const requiredBySlot = {};
  const conflicts = [];
  const bodyItems = [];
  const beltItems = [];

  for (const item of requiredItems) {
    if (isBeltType(item)) {
      beltItems.push(item);
      continue;
    }
    const slot = String(item.slot || "")
      .trim()
      .toLowerCase();
    if (!SLOTS.includes(slot)) {
      conflicts.push(`Item ${item._id} has unsupported slot "${item.slot}"`);
      continue;
    }
    if (slot === "body") {
      bodyItems.push(item);
      continue;
    }
    if (requiredBySlot[slot]) {
      if (slot === "head") {
        const existing = requiredBySlot[slot];
        const a = getLayeringMetadata(existing);
        const b = getLayeringMetadata(item);
        if (
          a.layerRoles.includes("neckwear") &&
          b.layerRoles.includes("neckwear")
        ) {
          conflicts.push("Multiple neckwear items selected — pick one.");
          continue;
        }
        continue;
      }
      conflicts.push(
        `Multiple required items share the ${slot} slot — pick one per slot.`,
      );
      continue;
    }
    requiredBySlot[slot] = item;
  }

  if (beltItems.length > 1) {
    conflicts.push("Multiple belts selected — pick one.");
  }

  if (bodyItems.length === 1) {
    requiredBySlot.body = bodyItems[0];
  } else if (bodyItems.length > 1) {
    const dress = bodyItems.find(isDress);
    requiredBySlot.body = dress || bodyItems[0];
    const roleUsed = new Set();
    for (const item of bodyItems) {
      if (isDress(item)) continue;
      const roles = getLayeringMetadata(item).layerRoles.filter((r) =>
        ["base_top", "mid_layer", "outer_layer"].includes(r),
      );
      const free = roles.find((r) => !roleUsed.has(r));
      if (!free) {
        conflicts.push(
          "Selected tops cannot be layered together — they need different layer roles (base / mid / outer).",
        );
        break;
      }
      roleUsed.add(free);
    }
  }

  const occupiedSlots = new Set(Object.keys(requiredBySlot));
  if (bodyItems.length > 0) occupiedSlots.add("body");
  if (beltItems.length > 0) occupiedSlots.add("waist_accessory");

  const bodyItem = requiredBySlot.body || null;
  const dressPath = Boolean(bodyItem && isDress(bodyItem));

  const missingSlots = new Set();
  if (!occupiedSlots.has("feet")) missingSlots.add("feet");

  if (dressPath) {
    // legs not required
  } else if (occupiedSlots.has("body") && !occupiedSlots.has("legs")) {
    missingSlots.add("legs");
  } else if (occupiedSlots.has("legs") && !occupiedSlots.has("body")) {
    missingSlots.add("body");
  } else if (!occupiedSlots.has("body") && !occupiedSlots.has("legs")) {
    missingSlots.add("body");
    missingSlots.add("legs");
  }

  if (beltItems.length > 0 && !occupiedSlots.has("legs") && !dressPath) {
    missingSlots.add("legs");
  }

  const optionalSlots = new Set();
  if (!occupiedSlots.has("head")) optionalSlots.add("head");
  if (!occupiedSlots.has("waist_accessory")) {
    optionalSlots.add("waist_accessory");
  }

  let fillSlots;
  if (mode === "improve") {
    fillSlots = new Set(optionalSlots);
    for (const slot of missingSlots) fillSlots.add(slot);
  } else {
    fillSlots = new Set([...missingSlots, ...optionalSlots]);
  }

  return {
    requiredBySlot,
    occupiedSlots,
    missingSlots,
    optionalSlots,
    fillSlots,
    dressPath,
    conflicts,
    bodyItems,
    beltItems,
  };
};
