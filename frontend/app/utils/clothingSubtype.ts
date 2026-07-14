import { ClothingItem } from "../types/clothes";

/**
 * Client-side clothing subtype resolution (mirrors backend).
 * Never infer button_up from bare "Shirt".
 */

export type ClothingSubtype =
  | "t_shirt"
  | "long_sleeve_t_shirt"
  | "tank_top"
  | "polo"
  | "button_up"
  | "dress_shirt"
  | "overshirt"
  | "flannel"
  | "blouse"
  | "sweater"
  | "crewneck_sweater"
  | "v_neck_sweater"
  | "cardigan"
  | "sweater_vest"
  | "hoodie"
  | "zip_hoodie"
  | "pullover_hoodie"
  | "jacket"
  | "denim_jacket"
  | "bomber_jacket"
  | "leather_jacket"
  | "blazer"
  | "coat"
  | "jeans"
  | "jorts"
  | "chinos"
  | "trousers"
  | "dress_pants"
  | "shorts"
  | "cargo_shorts"
  | "joggers"
  | "sweatpants"
  | "skirt"
  | "dress"
  | "belt"
  | "tie"
  | "shoes"
  | "other"
  | "vest"
  | "other_top";

const LABELS: Record<string, string> = {
  t_shirt: "T-Shirt",
  long_sleeve_t_shirt: "Long-Sleeve Tee",
  tank_top: "Tank Top",
  polo: "Polo",
  button_up: "Button-Up",
  dress_shirt: "Dress Shirt",
  overshirt: "Overshirt",
  flannel: "Flannel",
  blouse: "Blouse",
  sweater: "Sweater",
  crewneck_sweater: "Crewneck Sweater",
  v_neck_sweater: "V-Neck Sweater",
  cardigan: "Cardigan",
  sweater_vest: "Sweater Vest",
  hoodie: "Hoodie",
  zip_hoodie: "Zip Hoodie",
  pullover_hoodie: "Pullover Hoodie",
  jacket: "Jacket",
  denim_jacket: "Denim Jacket",
  bomber_jacket: "Bomber Jacket",
  leather_jacket: "Leather Jacket",
  blazer: "Blazer",
  coat: "Coat",
  jeans: "Jeans",
  jorts: "Jorts",
  chinos: "Chinos",
  trousers: "Trousers",
  dress_pants: "Dress Pants",
  shorts: "Shorts",
  cargo_shorts: "Cargo Shorts",
  joggers: "Joggers",
  sweatpants: "Sweatpants",
  skirt: "Skirt",
  dress: "Dress",
  belt: "Belt",
  tie: "Tie",
  shoes: "Shoes",
  other: "Other",
  vest: "Vest",
  other_top: "Shirt",
};

const haystack = (item: ClothingItem & { subtype?: string; name?: string }) =>
  [
    (item as { subtype?: string }).subtype,
    item.stylingMetadata &&
      (item.stylingMetadata as { subtype?: string }).subtype,
    item.type,
    (item as { name?: string }).name,
    item.material,
    item.fit,
    item.pattern,
    item.stylingMetadata?.styleCategory,
    ...(item.stylingMetadata?.occasionTags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export function resolveClothingSubtype(
  item: ClothingItem & { subtype?: string; name?: string },
): ClothingSubtype {
  if (!item) return "other";

  const explicit = String(
    (item as { subtype?: string }).subtype ||
      (item.stylingMetadata as { subtype?: string } | null | undefined)
        ?.subtype ||
      "",
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (explicit && LABELS[explicit]) return explicit as ClothingSubtype;

  const slot = String(item.slot || "").toLowerCase();
  const t = String(item.type || "")
    .toLowerCase()
    .trim();
  const hay = haystack(item);

  if (/\bbelt\b/.test(hay)) return "belt";
  if (/^(tie|bow\s*tie)$|necktie|bowtie/.test(hay)) return "tie";
  if (slot === "feet" || /shoe|sneaker|boot|loafer|sandal|heel/.test(hay))
    return "shoes";

  if (/\bdress\b/.test(t) && !/dress\s*shirt|dress\s*pant/.test(t))
    return "dress";

  if (
    slot === "legs" ||
    /jean|jort|chino|trouser|short|jogger|sweatpant|skirt|pant/.test(hay)
  ) {
    if (/jort|jean\s*short|denim\s*short/.test(hay)) return "jorts";
    if (/cargo\s*short/.test(hay)) return "cargo_shorts";
    if (/\bjean/.test(hay) && !/jacket|shirt/.test(hay)) return "jeans";
    if (/chino|khaki/.test(hay)) return "chinos";
    if (/dress\s*pant|slacks/.test(hay)) return "dress_pants";
    if (/jogger/.test(hay)) return "joggers";
    if (/sweatpant/.test(hay)) return "sweatpants";
    if (/\bskirt\b/.test(hay)) return "skirt";
    if (/\bshort/.test(hay)) return "shorts";
    if (/trouser|pants?/.test(hay)) return "trousers";
  }

  if (/blazer/.test(hay)) return "blazer";
  if (/denim\s*jacket|jean\s*jacket/.test(hay)) return "denim_jacket";
  if (/bomber/.test(hay)) return "bomber_jacket";
  if (/leather\s*jacket/.test(hay)) return "leather_jacket";
  if (/\bcoat\b|parka|trench|overcoat/.test(hay)) return "coat";
  if (/jacket|windbreaker|raincoat/.test(hay)) return "jacket";

  if (/long[\s-]?sleeve.*(t[\s-]?shirt|tee)/.test(hay))
    return "long_sleeve_t_shirt";
  if (/t[\s-]?shirt|\btee\b/.test(hay)) return "t_shirt";
  if (/\btank\b|camisole/.test(hay)) return "tank_top";
  if (/\bpolo\b/.test(hay)) return "polo";
  if (/overshirt|shacket/.test(hay)) return "overshirt";
  if (/\bflannel\b/.test(hay)) return "flannel";
  if (/dress\s*shirt|\boxford\b/.test(hay)) return "dress_shirt";
  if (/button[\s-]?up|button[\s-]?down|button[\s-]?front/.test(hay))
    return "button_up";
  if (/sweater\s*vest|knit\s*vest/.test(hay)) return "sweater_vest";
  if (/\bcardigan\b/.test(hay)) return "cardigan";
  if (/\bhoodie\b|hooded/.test(hay)) {
    if (/zip|zipper/.test(hay)) return "zip_hoodie";
    if (/pullover|crew/.test(hay)) return "pullover_hoodie";
    return "hoodie";
  }
  if (/\bvest\b/.test(hay)) return "vest";
  if (/v[\s-]?neck.*sweater|sweater.*v[\s-]?neck/.test(hay))
    return "v_neck_sweater";
  if (/crew(neck)?.*sweater|sweater.*crew/.test(hay))
    return "crewneck_sweater";
  if (
    /\bsweater\b|\bpullover\b|\bturtleneck\b/.test(hay) &&
    !/\bshirt\b/.test(t)
  ) {
    return "sweater";
  }
  if (/\bblouse\b/.test(hay)) return "blouse";
  // Never treat bare "Shirt" as button_up
  if (/^shirt$/.test(t) || (/\bshirt\b/.test(t) && !/dress\s*shirt/.test(t)))
    return "other_top";

  return slot === "body" ? "other_top" : "other";
}

export function humanizeClothingSubtype(
  item: ClothingItem & { subtype?: string; name?: string },
): string {
  const subtype = resolveClothingSubtype(item);
  if (subtype === "other" || subtype === "other_top") {
    return item.type || "Item";
  }
  return LABELS[subtype] || item.type || "Item";
}
