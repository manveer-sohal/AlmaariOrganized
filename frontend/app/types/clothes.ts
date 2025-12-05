export type ClothingItem = {
  _id: string; // Unique ID for the clothing item
  colour: string[]; // Array of colours
  type: string; // Type of clothing
  slot: Slot; // Slot of the clothing item
  imageSrc: string; // Base64 encoded image
};
export type Outfit = {
  uniqueId: string;
  name: string;
  outfit_items: ClothingItem[];
};

export type Slot = "head" | "body" | "legs" | "feet";

export type View = "home" | "outfits" | "createOutfit" | "addClothes";

export type coloursList =
  | "Black"
  | "White"
  | "Brown"
  | "Beige"
  | "Grey"
  | "Pink"
  | "Navy"
  | "Green"
  | "Red"
  | "Blue"
  | "Purple"
  | "Yellow"
  | "Orange"
  | "Camo";

export type typeList =
  | "Shirt"
  | "Jeans"
  | "Sweater"
  | "Jacket"
  | "T-shirt"
  | "Shorts"
  | "Skirt"
  | "Dress"
  | "Blouse"
  | "Trousers"
  | "Hoodie"
  | "Coat"
  | "Cardigan"
  | "Tank Top"
  | "Pajamas"
  | "Socks"
  | "Scarf"
  | "Hat"
  | "Gloves"
  | "Cargos"
  | "Jeans"
  | "Dress Shirt"
  | "Leggings"
  | "Vest"
  | "Swimsuit"
  | "Raincoat"
  | "Overalls"
  | "Jumper"
  | "Blazer"
  | "Crop Top"
  | "Pants"
  | "Capri Pants"
  | "Suit"
  | "Tie"
  | "Belt"
  | "Tunic"
  | "Poncho"
  | "Robe"
  | "Underwear"
  | "Shoes";
