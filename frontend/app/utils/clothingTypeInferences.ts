import { materials_List } from "../data/constants";
import { ClothingAnalysisTags } from "../types/clothingAnalysis";

/**
 * Keep in sync with backend/utils/clothingTypeInferences.js
 */
const INFERRED_BY_TYPE_KEY: Record<string, { material?: string }> = {
  chinos: { material: "Cotton" },
  jeans: { material: "Denim" },
  jorts: { material: "Denim" },
  denim_jacket: { material: "Denim" },
  leather_jacket: { material: "Leather" },
  t_shirt: { material: "Cotton" },
  polo: { material: "Cotton" },
  dress_shirt: { material: "Cotton" },
  button_up: { material: "Cotton" },
  oxford: { material: "Cotton" },
  flannel: { material: "Cotton" },
  linen: { material: "Linen" },
  sweater: { material: "Knit" },
  cardigan: { material: "Knit" },
  hoodie: { material: "Fleece" },
  sweatshirt: { material: "Fleece" },
  sweatpants: { material: "Fleece" },
  joggers: { material: "Cotton" },
  leggings: { material: "Polyester" },
  blazer: { material: "Wool" },
  wool_coat: { material: "Wool" },
  coat: { material: "Wool" },
  trench_coat: { material: "Cotton" },
  parka: { material: "Nylon" },
  windbreaker: { material: "Nylon" },
  raincoat: { material: "Nylon" },
  leather_boots: { material: "Leather" },
  canvas_shoes: { material: "Canvas" },
  tie: { material: "Silk" },
  silk: { material: "Silk" },
};

const normalizeSubtypeKey = (subtype: unknown): string | null => {
  if (subtype == null || typeof subtype !== "string") return null;
  const key = subtype.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return key || null;
};

export const resolveClothingTypeKey = (
  typeValue: string | null | undefined,
  subtypeValue?: string | null,
): string | null => {
  const subtypeKey = normalizeSubtypeKey(subtypeValue);
  if (subtypeKey && INFERRED_BY_TYPE_KEY[subtypeKey]) {
    return subtypeKey;
  }

  const type = String(typeValue || "")
    .trim()
    .toLowerCase();
  if (!type) return null;

  if (/chino/.test(type)) return "chinos";
  if (/jort/.test(type)) return "jorts";
  if (/jean/.test(type) && !/jacket/.test(type)) return "jeans";
  if (/denim jacket/.test(type)) return "denim_jacket";
  if (/leather jacket/.test(type)) return "leather_jacket";
  if (/t[- ]?shirt/.test(type)) return "t_shirt";
  if (/polo/.test(type)) return "polo";
  if (/dress shirt/.test(type)) return "dress_shirt";
  if (/button[- ]?up/.test(type)) return "button_up";
  if (/oxford/.test(type)) return "oxford";
  if (/flannel/.test(type)) return "flannel";
  if (/linen/.test(type)) return "linen";
  if (/silk/.test(type)) return "silk";
  if (/sweater|jumper/.test(type)) return "sweater";
  if (/cardigan/.test(type)) return "cardigan";
  if (/hoodie/.test(type)) return "hoodie";
  if (/sweatshirt/.test(type)) return "sweatshirt";
  if (/sweatpant/.test(type)) return "sweatpants";
  if (/jogger/.test(type)) return "joggers";
  if (/legging/.test(type)) return "leggings";
  if (/blazer/.test(type)) return "blazer";
  if (/wool/.test(type) && /coat/.test(type)) return "wool_coat";
  if (/trench/.test(type)) return "trench_coat";
  if (/parka/.test(type)) return "parka";
  if (/windbreaker/.test(type)) return "windbreaker";
  if (/raincoat/.test(type)) return "raincoat";
  if (/leather boot/.test(type)) return "leather_boots";
  if (/boot/.test(type) && /leather/.test(type)) return "leather_boots";
  if (/sneaker|trainer/.test(type) && /canvas/.test(type)) {
    return "canvas_shoes";
  }
  if (/bow tie|^tie$/.test(type) || (/\btie\b/.test(type) && !/neck/.test(type))) {
    return "tie";
  }
  if (/^coat$|overcoat|peacoat|topcoat/.test(type)) return "coat";

  return null;
};

/** Apply type-based rules to AI analysis tags before filling the form. */
export function applyClothingTypeInferencesToTags(
  tags: ClothingAnalysisTags,
): ClothingAnalysisTags {
  const typeKey = resolveClothingTypeKey(
    tags.type?.value,
    tags.subtype?.value,
  );
  if (!typeKey) return tags;

  const rules = INFERRED_BY_TYPE_KEY[typeKey];
  if (!rules?.material || !materials_List.includes(rules.material)) {
    return tags;
  }

  const current = String(tags.material?.value || "").trim();
  if (current.toLowerCase() === rules.material.toLowerCase()) {
    return tags;
  }

  return {
    ...tags,
    material: {
      value: rules.material,
      confidence: Math.max(tags.material?.confidence ?? 0, 0.92),
    },
  };
}
