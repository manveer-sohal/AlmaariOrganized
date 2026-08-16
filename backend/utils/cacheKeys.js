/**
 * Canonical Redis key builders for wardrobe / outfit caches.
 * Keep all key formats here so invalidation never drifts from writers.
 */
export const clothesCacheKeys = {
  /** Paginated wardrobe list page. */
  page: (auth0Id, page, limit) =>
    `userClothes:${auth0Id}:page:${page}:limit:${limit}`,

  /** Legacy pre-pagination key (still deleted on invalidate). */
  legacyAll: (auth0Id) => `userClothes:${auth0Id}`,

  /** SCAN match for every clothes cache key belonging to a user. */
  allPagesPattern: (auth0Id) => `userClothes:${auth0Id}:*`,
};

export const outfitCacheKeys = {
  all: (auth0Id) => `userOutfits:${auth0Id}`,
};

export const userCacheKeys = {
  objectId: (auth0Id) => `userObjectId:${auth0Id}`,
};
