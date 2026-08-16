/**
 * Canonical clothing type → outfit slot.
 * Prefer exact matches over substring heuristics to avoid false positives
 * (e.g. "Capri Pants".includes("cap") → head).
 */
export const TYPE_TO_SLOT = {
  // Accessories (head)
  Hat: "head",
  Cap: "head",
  Beanie: "head",
  Scarf: "head",
  Gloves: "head",
  Headband: "head",
  Sunglasses: "head",
  Earrings: "head",
  Necklace: "head",
  Bracelet: "head",
  Watch: "head",
  Bag: "head",
  Handbag: "head",
  Backpack: "head",
  Purse: "head",
  Clutch: "head",
  Tote: "head",

  // Tops / full pieces worn on torso (body)
  "Polo Shirt": "body",
  Shirt: "body",
  "T-shirt": "body",
  "T-Shirt": "body",
  "Dress Shirt": "body",
  "Button-Up": "body",
  "Button-Up Shirt": "body",
  Polo: "body",
  Blouse: "body",
  "Tank Top": "body",
  "Crop Top": "body",
  Camisole: "body",
  Sweater: "body",
  Sweatshirt: "body",
  Hoodie: "body",
  Jumper: "body",
  Cardigan: "body",
  Vest: "body",
  "Sweater Vest": "body",
  Jacket: "body",
  "Denim Jacket": "body",
  "Bomber Jacket": "body",
  "Leather Jacket": "body",
  Blazer: "body",
  Coat: "body",
  Raincoat: "body",
  Windbreaker: "body",
  Parka: "body",
  "Trench Coat": "body",
  Peacoat: "body",
  Poncho: "body",
  Cape: "body",
  Kimono: "body",
  Tunic: "body",
  Robe: "body",
  Dress: "body",
  Jumpsuit: "body",
  Romper: "body",
  Suit: "body",
  Swimsuit: "body",
  Bikini: "body",
  Bodysuit: "body",
  Jersey: "body",
  Henley: "body",
  "Sports Bra": "body",
  Corset: "body",
  Waistcoat: "body",
  Overshirt: "body",
  Shacket: "body",
  Flannel: "body",
  Tie: "body",
  "Bow Tie": "body",

  // Bottoms (legs)
  Jeans: "legs",
  Jorts: "legs",
  Trousers: "legs",
  Pants: "legs",
  Chinos: "legs",
  Shorts: "legs",
  Skirt: "legs",
  Leggings: "legs",
  Cargos: "legs",
  "Cargo Pants": "legs",
  "Capri Pants": "legs",
  Capris: "legs",
  Overalls: "legs",
  Dungarees: "legs",
  Joggers: "legs",
  Sweatpants: "legs",
  Culottes: "legs",
  Palazzos: "legs",
  "Palazzo Pants": "legs",
  Pajamas: "legs",
  "Pajama Pants": "legs",
  Underwear: "legs",
  Briefs: "legs",
  Boxers: "legs",
  Tights: "legs",
  Suspenders: "legs",
  Kilt: "legs",
  Sarong: "legs",

  // Waist accessory (stored as head/accessory slot)
  Belt: "head",

  // Footwear (feet)
  Shoes: "feet",
  Socks: "feet",
  Boots: "feet",
  "Ankle Boots": "feet",
  Sneakers: "feet",
  Trainers: "feet",
  Sandals: "feet",
  Heels: "feet",
  Flats: "feet",
  Loafers: "feet",
  Oxfords: "feet",
  Slippers: "feet",
  Mules: "feet",
  Wedges: "feet",
  Espadrilles: "feet",
  Clogs: "feet",
};

/** Allowed clothing types (sorted for UI dropdowns). */
export const TYPE_LIST = Object.keys(TYPE_TO_SLOT).sort((a, b) =>
  a.localeCompare(b),
);

export const mapTypeToSlot = (type) => {
  if (type == null || typeof type !== "string") return "body";

  const trimmed = type.trim();
  if (!trimmed) return "body";

  if (TYPE_TO_SLOT[trimmed]) {
    return TYPE_TO_SLOT[trimmed];
  }

  const matchedKey = Object.keys(TYPE_TO_SLOT).find(
    (key) => key.toLowerCase() === trimmed.toLowerCase(),
  );
  if (matchedKey) {
    return TYPE_TO_SLOT[matchedKey];
  }

  // Heuristic fallback for unknown / free-text types. Order matters:
  // check specific tokens before broad ones (capri before cap, belt before top).
  const t = trimmed.toLowerCase();

  if (
    t.includes("belt") ||
    t.includes("suspender") ||
    t.includes("jeans") ||
    t.includes("chino") ||
    t.includes("jogger") ||
    t.includes("sweatpant") ||
    t.includes("trouser") ||
    t.includes("legging") ||
    t.includes("short") ||
    t.includes("skirt") ||
    t.includes("cargo") ||
    t.includes("capri") ||
    t.includes("overall") ||
    t.includes("dungaree") ||
    t.includes("pajama") ||
    t.includes("pyjama") ||
    t.includes("underwear") ||
    t.includes("brief") ||
    t.includes("boxer") ||
    t.includes("tight") ||
    t.includes("culotte") ||
    t.includes("palazzo") ||
    (t.includes("pant") && !t.includes("pantie"))
  ) {
    return "legs";
  }

  if (
    t.includes("shoe") ||
    t.includes("boot") ||
    t.includes("sneaker") ||
    t.includes("trainer") ||
    t.includes("sandal") ||
    t.includes("heel") ||
    t.includes("loafer") ||
    t.includes("slipper") ||
    t.includes("mule") ||
    t.includes("wedge") ||
    t.includes("sock") ||
    t.includes("oxford") ||
    t.includes("clog") ||
    t.includes("espadrille") ||
    (t.includes("flat") && !t.includes("platform"))
  ) {
    return "feet";
  }

  if (
    t.includes("beanie") ||
    t.includes("scarf") ||
    t.includes("glove") ||
    t.includes("sunglass") ||
    t.includes("earring") ||
    t.includes("necklace") ||
    t.includes("bracelet") ||
    t.includes("watch") ||
    t.includes("handbag") ||
    t.includes("backpack") ||
    t.includes("purse") ||
    t.includes("clutch") ||
    t.includes("headband") ||
    t.includes("hat") ||
    (t.includes("cap") && !t.includes("cape") && !t.includes("capri")) ||
    t === "bag" ||
    t.endsWith(" bag") ||
    t.includes("tote")
  ) {
    return "head";
  }

  if (
    t.includes("dress") ||
    t.includes("jumpsuit") ||
    t.includes("romper") ||
    t.includes("shirt") ||
    t.includes("blouse") ||
    t.includes("hoodie") ||
    t.includes("jacket") ||
    t.includes("coat") ||
    t.includes("sweater") ||
    t.includes("jumper") ||
    t.includes("cardigan") ||
    t.includes("vest") ||
    t.includes("blazer") ||
    t.includes("top") ||
    t.includes("tunic") ||
    t.includes("poncho") ||
    t.includes("robe") ||
    t.includes("suit") ||
    t.includes("swimsuit") ||
    t.includes("bodysuit") ||
    t.includes("jersey") ||
    t.includes("kimono") ||
    t.includes("polo shirt") ||
    t.includes("bow tie") ||
    (t.includes("tie") && !t.includes("hoodie"))
  ) {
    return "body";
  }

  return "body";
};
