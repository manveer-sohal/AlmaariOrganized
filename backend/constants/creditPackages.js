/** Allowed demo purchase packages — source of truth for credit grants. */
export const CREDIT_PACKAGES = {
  starter: { credits: 5, price: 1.99 },
  growth: { credits: 15, price: 4.99 },
  pro: { credits: 40, price: 10.99 },
};

export const CREDIT_PACKAGE_IDS = Object.keys(CREDIT_PACKAGES);
