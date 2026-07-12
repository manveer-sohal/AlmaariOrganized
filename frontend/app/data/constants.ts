//list of colours for clothes
export const colours_List = [
  "Black",
  "White",
  "Grey",
  "Blue",
  "Navy",
  "Brown",
  "Beige",
  "Cream",
  "Green",
  "Olive",
  "Red",
  "Pink",
  "Purple",
  "Yellow",
  "Orange",
  "Camo",
];

//list of materials for clothes
export const materials_List = [
  "Cotton",
  "Denim",
  "Knit",
  "Wool",
  "Leather",
  "Linen",
  "Polyester",
  "Fleece",
  "Nylon",
  "Canvas",
  "Silk",
];

//list of fits for clothes
export const fits_List = ["Slim", "Regular", "Relaxed", "Oversized", "Baggy"];

//list of patterns for clothes
export const patterns_List = [
  "Solid",
  "Striped",
  "Checked",
  "Polka Dot",
  "Graphic",
  "Plaid",
  "Floral",
  "Camo",
];

export { type_List } from "../utils/mapTypeToSlot";

export const styleCategories_List = [
  "Casual",
  "Smart Casual",
  "Formal",
  "Athletic",
] as const;

export const occasionTags_List = [
  "Everyday",
  "Work",
  "Going Out",
  "Event",
  "Formal Event",
  "Travel",
  "Active",
] as const;

export const stylistNegativeReasons_List = [
  "Too formal",
  "Too casual",
  "Colours do not match",
  "Not my style",
  "Wrong season",
  "Poor item combination",
] as const;

