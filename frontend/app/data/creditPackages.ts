export type CreditPackageId = "starter" | "growth" | "pro";

export type CreditPackage = {
  id: CreditPackageId;
  credits: number;
  price: number;
  label: string;
  description: string;
  highlighted?: boolean;
};

const STARTER_PRICE_PER_CREDIT = 1.99 / 5;

export const getSavePercent = (credits: number, price: number): number => {
  const fullPrice = credits * STARTER_PRICE_PER_CREDIT;
  if (fullPrice <= price) return 0;
  return Math.round(((fullPrice - price) / fullPrice) * 100);
};

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    credits: 5,
    price: 1.99,
    label: "Starter",
    description: "Great for a few AI clothing analyses",
  },
  {
    id: "growth",
    credits: 15,
    price: 4.99,
    label: "Growth",
    description: "Best for regular wardrobe updates",
    highlighted: true,
  },
  {
    id: "pro",
    credits: 40,
    price: 10.99,
    label: "Pro",
    description: "Maximum credits for power organizers",
  },
];
