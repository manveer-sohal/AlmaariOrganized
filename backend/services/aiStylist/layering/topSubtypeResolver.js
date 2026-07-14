/**
 * Normalize clothing items into precise subtypes.
 * Never infer button_up from the bare word "shirt".
 * Prefer explicit subtype metadata when present.
 */

const TYPE = (item) => String(item?.type || "").toLowerCase().trim();

export const metadataHaystack = (item) =>
  [
    item?.subtype,
    item?.stylingMetadata?.subtype,
    item?.type,
    item?.name,
    item?.garmentName,
    item?.pattern,
    item?.material,
    item?.fit,
    item?.neckline,
    item?.closure,
    item?.styleCategory,
    item?.stylingMetadata?.styleCategory,
    item?.stylingMetadata?.outfitRole,
    ...(Array.isArray(item?.tags) ? item.tags : []),
    ...(Array.isArray(item?.season) ? item.season : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export const CLOTHING_SUBTYPES = [
  "t_shirt",
  "long_sleeve_t_shirt",
  "tank_top",
  "polo",
  "button_up",
  "dress_shirt",
  "overshirt",
  "flannel",
  "blouse",
  "sweater",
  "crewneck_sweater",
  "v_neck_sweater",
  "cardigan",
  "sweater_vest",
  "hoodie",
  "zip_hoodie",
  "pullover_hoodie",
  "jacket",
  "denim_jacket",
  "bomber_jacket",
  "leather_jacket",
  "blazer",
  "coat",
  "jeans",
  "jorts",
  "chinos",
  "trousers",
  "dress_pants",
  "shorts",
  "cargo_shorts",
  "joggers",
  "sweatpants",
  "skirt",
  "dress",
  "belt",
  "tie",
  "shoes",
  "other",
  // legacy aliases kept for layering
  "vest",
  "other_top",
];

export const CLOTHING_SUBTYPE_LABELS = {
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

const EXPLICIT_SUBTYPES = new Set(CLOTHING_SUBTYPES);

/**
 * Full clothing subtype resolution for any wardrobe item.
 * @returns {string}
 */
export const resolveClothingSubtype = (item) => {
  if (!item) return "other";

  const explicit = String(
    item.subtype || item.stylingMetadata?.subtype || "",
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (explicit && EXPLICIT_SUBTYPES.has(explicit)) {
    return explicit;
  }

  const slot = String(item.slot || "")
    .trim()
    .toLowerCase();
  const t = TYPE(item);
  const hay = metadataHaystack(item);

  if (/\bbelt\b/.test(hay)) return "belt";
  if (/^(tie|bow\s*tie)$|necktie|bowtie/.test(hay)) return "tie";
  if (slot === "feet" || /shoe|sneaker|boot|loafer|sandal|heel/.test(hay))
    return "shoes";

  // Dress (one-piece)
  if (/\bdress\b/.test(t) && !/dress\s*shirt|dress\s*pant/.test(t)) {
    return "dress";
  }

  // Bottoms
  if (
    slot === "legs" ||
    /jean|jort|chino|trouser|short|jogger|sweatpant|skirt|pant/.test(hay)
  ) {
    if (/jort|jean\s*short|denim\s*short/.test(hay)) return "jorts";
    if (/cargo\s*short/.test(hay)) return "cargo_shorts";
    if (/\bjean/.test(hay) && !/jacket|shirt/.test(hay)) return "jeans";
    if (/chino|khaki/.test(hay)) return "chinos";
    if (/dress\s*pant|dress\s*trousers|slacks/.test(hay)) return "dress_pants";
    if (/jogger/.test(hay)) return "joggers";
    if (/sweatpant|sweat\s*pant/.test(hay)) return "sweatpants";
    if (/\bskirt\b/.test(hay)) return "skirt";
    if (/\bshort/.test(hay)) return "shorts";
    if (/trouser|pants?/.test(hay)) return "trousers";
  }

  // Outerwear
  if (/blazer/.test(hay)) return "blazer";
  if (/denim\s*jacket|jean\s*jacket/.test(hay)) return "denim_jacket";
  if (/bomber/.test(hay)) return "bomber_jacket";
  if (/leather\s*jacket/.test(hay)) return "leather_jacket";
  if (/\bcoat\b|parka|trench|overcoat|peacoat/.test(hay)) return "coat";
  if (/jacket|windbreaker|raincoat/.test(hay)) return "jacket";

  // Tops / mids
  if (/long[\s-]?sleeve.*(t[\s-]?shirt|tee)|ls\s*tee/.test(hay))
    return "long_sleeve_t_shirt";
  if (/t[\s-]?shirt|\btee\b|tees\b/.test(hay)) return "t_shirt";
  if (/\btank\b|camisole/.test(hay)) return "tank_top";
  if (/\bpolo\b/.test(hay)) return "polo";
  if (/overshirt|shacket/.test(hay)) return "overshirt";
  if (/\bflannel\b/.test(hay)) return "flannel";
  if (/dress\s*shirt|\boxford\b/.test(hay)) return "dress_shirt";
  if (
    /button[\s-]?up|button[\s-]?down|button[\s-]?front|snap[\s-]?front/.test(hay)
  ) {
    return "button_up";
  }
  if (/sweater\s*vest|knit\s*vest/.test(hay)) return "sweater_vest";
  if (/\bcardigan\b/.test(hay)) return "cardigan";
  if (/\bhoodie\b|hooded/.test(hay)) {
    if (/zip|zipper|open.?front/.test(hay)) return "zip_hoodie";
    if (/pullover|crew/.test(hay)) return "pullover_hoodie";
    return "hoodie";
  }
  if (/\bvest\b|\bgilet\b/.test(hay)) return "vest";
  if (/v[\s-]?neck.*sweater|sweater.*v[\s-]?neck/.test(hay))
    return "v_neck_sweater";
  if (/crew(neck)?.*sweater|sweater.*crew/.test(hay)) return "crewneck_sweater";
  if (
    /\bsweater\b|\bpullover\b|\bturtleneck\b|\bknit\b|\bfleece\b/.test(hay) &&
    !/\bshirt\b/.test(t)
  ) {
    return "sweater";
  }
  if (/\bblouse\b/.test(hay)) return "blouse";

  // Ambiguous shirt → other_top (NOT button_up)
  if (/^shirt$/.test(t) || (/\bshirt\b/.test(t) && !/dress\s*shirt/.test(t))) {
    return "other_top";
  }

  return slot === "body" ? "other_top" : "other";
};

/**
 * Map full subtype → top-layering subtype used by openability / roles.
 */
export const resolveTopSubtype = (item) => {
  if (!item) return "other_top";
  const slot = String(item.slot || "")
    .trim()
    .toLowerCase();
  // Bottoms / shoes are not top subtypes
  if (slot === "legs" || slot === "feet") return "other_top";

  const subtype = resolveClothingSubtype(item);
  const map = {
    long_sleeve_t_shirt: "t_shirt",
    crewneck_sweater: "sweater",
    v_neck_sweater: "sweater",
    sweater_vest: "vest",
    zip_hoodie: "hoodie",
    pullover_hoodie: "hoodie",
    denim_jacket: "other_top",
    bomber_jacket: "other_top",
    leather_jacket: "other_top",
    jacket: "other_top",
    blazer: "other_top",
    coat: "other_top",
    jeans: "other_top",
    jorts: "other_top",
    chinos: "other_top",
    trousers: "other_top",
    dress_pants: "other_top",
    shorts: "other_top",
    cargo_shorts: "other_top",
    joggers: "other_top",
    sweatpants: "other_top",
    skirt: "other_top",
    dress: "other_top",
    belt: "other_top",
    tie: "other_top",
    shoes: "other_top",
    other: "other_top",
  };
  if (
    [
      "t_shirt",
      "tank_top",
      "polo",
      "button_up",
      "dress_shirt",
      "overshirt",
      "flannel",
      "blouse",
      "sweater",
      "hoodie",
      "cardigan",
      "vest",
      "other_top",
    ].includes(subtype)
  ) {
    return subtype;
  }
  return map[subtype] || "other_top";
};

export const TOP_SUBTYPES = [
  "t_shirt",
  "tank_top",
  "polo",
  "button_up",
  "dress_shirt",
  "overshirt",
  "flannel",
  "blouse",
  "sweater",
  "hoodie",
  "cardigan",
  "vest",
  "other_top",
];

export const TOP_SUBTYPE_LABELS = CLOTHING_SUBTYPE_LABELS;

/**
 * How strongly a mid/outer layer needs a base top underneath.
 * @returns {"required"|"preferred"|"optional"|"not_applicable"}
 */
export const resolveBaseLayerRequirement = (item) => {
  if (!item) return "not_applicable";
  const subtype = resolveClothingSubtype(item);
  if (
    [
      "jacket",
      "denim_jacket",
      "bomber_jacket",
      "leather_jacket",
      "blazer",
      "coat",
    ].includes(subtype)
  ) {
    return "required";
  }
  if (subtype === "sweater_vest") return "required";
  if (subtype === "v_neck_sweater" || subtype === "cardigan") return "preferred";
  if (subtype === "zip_hoodie") return "preferred";
  if (
    ["sweater", "crewneck_sweater", "hoodie", "pullover_hoodie", "vest"].includes(
      subtype,
    )
  ) {
    return "optional";
  }
  if (["overshirt", "flannel", "button_up"].includes(subtype)) {
    return "optional"; // when used as mid
  }
  return "not_applicable";
};

export const humanizeClothingSubtype = (subtype, item) => {
  if (!subtype || subtype === "other" || subtype === "other_top") {
    return item?.type || "Item";
  }
  return CLOTHING_SUBTYPE_LABELS[subtype] || item?.type || "Item";
};

export const humanizeTopSubtype = (subtype, item) => {
  if (subtype === "hoodie") {
    const full = item ? resolveClothingSubtype(item) : subtype;
    if (full === "zip_hoodie") return "Zip Hoodie";
    if (full === "pullover_hoodie") return "Pullover Hoodie";
    return "Hoodie";
  }
  if (subtype === "sweater") {
    const full = item ? resolveClothingSubtype(item) : subtype;
    if (full === "crewneck_sweater") return "Crewneck Sweater";
    if (full === "v_neck_sweater") return "V-Neck Sweater";
    return "Sweater";
  }
  return humanizeClothingSubtype(subtype, item);
};

export { TYPE as itemTypeString };
