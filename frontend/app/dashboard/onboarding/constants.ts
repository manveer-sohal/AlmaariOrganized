export const STYLE_OPTIONS = [
  "Old money",
  "Streetwear",
  "Minimal",
  "Casual",
  "Smart casual",
  "Quiet luxury",
  "Preppy",
  "Athletic",
  "Bohemian",
  "Vintage",
  "Y2K",
  "Formal",
] as const;

export type StyleOption = typeof STYLE_OPTIONS[number];

export type SeasonalPalette = {
  id: string;
  name: string;
  blurb: string;
  swatches: string[];
};

export const SEASONAL_PALETTES: SeasonalPalette[] = [
  {
    id: "Spring",
    name: "Spring",
    blurb: "Warm, clear, and fresh",
    swatches: ["#F6C1A0", "#E8A87C", "#7CB083", "#F2D27A", "#E87A6B"],
  },
  {
    id: "Summer",
    name: "Summer",
    blurb: "Cool, soft, and muted",
    swatches: ["#C9B8D4", "#A8C4D4", "#E8B4C8", "#9BB0C8", "#D4C4B0"],
  },
  {
    id: "Autumn",
    name: "Autumn",
    blurb: "Warm, deep, and earthy",
    swatches: ["#8B5A3C", "#C4783A", "#6B7A3A", "#A63D3D", "#D4A84B"],
  },
  {
    id: "Winter",
    name: "Winter",
    blurb: "Cool, bold, and high contrast",
    swatches: ["#1A1A2E", "#C41E3A", "#2E5A88", "#0D7377", "#F5F5F5"],
  },
];

/** Popular brands for autocomplete; users can also add custom names. */
export const BRAND_CATALOG = [
  "& Other Stories",

  "7 For All Mankind",

  "A Bathing Ape",

  "A-Cold-Wall*",

  "A.P.C.",

  "Aerie",

  "Aeropostale",

  "Aimé Leon Dore",

  "AKIRA",

  "Aldo",

  "Alexander McQueen",

  "Alexander Wang",

  "AllSaints",

  "Alo Yoga",

  "American Eagle",

  "Amiri",

  "Ann Taylor",

  "Anthropologie",

  "APL",

  "Arcteryx",

  "Arc'teryx",

  "Armani",

  "Armani Exchange",

  "ASICS",

  "ASOS",

  "Athleta",

  "Aviator Nation",

  "Balenciaga",

  "Balmain",

  "Banana Republic",

  "Barbour",

  "Bershka",

  "Billabong",

  "Birkenstock",

  "Boden",

  "Boohoo",

  "Boss",

  "Bottega Veneta",

  "Brandy Melville",

  "Brooks",

  "Brooks Brothers",

  "Burberry",

  "Canada Goose",

  "Calvin Klein",

  "Carhartt",

  "Carhartt WIP",

  "Casablanca",

  "Champion",

  "Charles & Keith",

  "Chanel",

  "Chaps",

  "Chrome Hearts",

  "Clarks",

  "Club Monaco",

  "Coach",

  "Cole Haan",

  "Columbia",

  "Comme des Garçons",

  "Converse",

  "COS",

  "Crocs",

  "Daily Paper",

  "Dickies",

  "Diesel",

  "Dior",

  "Dockers",

  "Dolce & Gabbana",

  "Dr. Martens",

  "Eddie Bauer",

  "Ellesse",

  "Everlane",

  "Express",

  "Fabletics",

  "Fashion Nova",

  "Fear of God",

  "Fila",

  "Foot Locker",

  "Forever 21",

  "Free People",

  "French Connection",

  "Fruit of the Loom",

  "G-Star RAW",

  "Ganni",

  "Gap",

  "GAP Factory",

  "Givenchy",

  "Golden Goose",

  "Guess",

  "Gymshark",

  "H&M",

  "Hanes",

  "Helly Hansen",

  "Hermès",

  "Hoka",

  "Hollister",

  "House of CB",

  "Hugo",

  "Hurley",

  "J.Crew",

  "Jack & Jones",

  "Jacquemus",

  "Joe Fresh",

  "Jordan",

  "Juicy Couture",

  "Kate Spade",

  "Kappa",

  "Kith",

  "Knix",

  "L.L.Bean",

  "Lacoste",

  "Lane Bryant",

  "Le Château",

  "Levi's",

  "Loewe",

  "Loro Piana",

  "Louis Vuitton",

  "Lululemon",

  "Lucky Brand",

  "Lugz",

  "Mackage",

  "Mango",

  "Marc Jacobs",

  "Massimo Dutti",

  "Michael Kors",

  "Missguided",

  "Moncler",

  "Montbell",

  "Mountain Hardwear",

  "New Balance",

  "Nike",

  "No Bull",

  "Nordstrom",

  "Oakley",

  "Off-White",

  "Old Navy",

  "On",

  "Outdoor Voices",

  "Pacsun",

  "Palm Angels",

  "Patagonia",

  "Paul Smith",

  "Polo Ralph Lauren",

  "Prada",

  "PrettyLittleThing",

  "Primark",

  "Princess Polly",

  "Pull&Bear",

  "Puma",

  "Quiksilver",

  "Rag & Bone",

  "Ralph Lauren",

  "Ray-Ban",

  "Reebok",

  "Reformation",

  "Reiss",

  "Represent",

  "Revolve",

  "Rick Owens",

  "Rip Curl",

  "Roots",

  "Roxy",

  "Russell Athletic",

  "Saint Laurent",

  "Salomon",

  "Saucony",

  "Scotch & Soda",

  "Sézane",

  "Shein",

  "Skims",

  "Smartwool",

  "Spanx",

  "Sperry",

  "Sport Chek",

  "Steve Madden",

  "Stone Island",

  "Stüssy",

  "Superdry",

  "Supreme",

  "Ted Baker",

  "The Kooples",

  "The North Face",

  "Theory",

  "Timberland",

  "Tom Ford",

  "Tommy Bahama",

  "Tommy Hilfiger",

  "Topman",

  "Topshop",

  "True Religion",

  "UGG",

  "Under Armour",

  "Uniqlo",

  "Urban Outfitters",

  "Valentino",

  "Vans",

  "Varley",

  "VEJA",

  "Versace",

  "Victoria's Secret",

  "Vince",

  "Vineyard Vines",

  "Vuori",

  "Weekday",

  "White Fox",

  "Windsor",

  "Wrangler",

  "Y-3",

  "Yeezy",

  "Zadig & Voltaire",

  "Zara",

  "Zimmermann",

  "Z Supply",
].filter((brand, index, list) => list.indexOf(brand) === index);
