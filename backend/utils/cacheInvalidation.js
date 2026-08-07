import { redis } from "../libs/redis.client.js";
import { clothesCacheKeys, outfitCacheKeys } from "./cacheKeys.js";
import { logInfo, logWarn } from "../observability/logger.js";
import { createTimer } from "../observability/timer.js";
import { incMetric, observeMs } from "../observability/metrics.js";

const SCAN_COUNT = 100;

/**
 * Delete every paginated (and legacy) wardrobe list cache key for a user.
 * Redis is optional — failures are logged and swallowed.
 *
 * @returns {{ deleted: number, durationMs: number, ok: boolean }}
 */
export const invalidateUserClothesCache = async (
  auth0Id,
  { client } = {},
) => {
  const timer = createTimer();
  if (!auth0Id) {
    return { deleted: 0, durationMs: 0, ok: true };
  }

  const r = client || redis;

  try {
    const matchingKeys = [];
    const pattern = clothesCacheKeys.allPagesPattern(auth0Id);

    if (typeof r.scanIterator === "function") {
      for await (const key of r.scanIterator({
        MATCH: pattern,
        COUNT: SCAN_COUNT,
      })) {
        matchingKeys.push(key);
      }
    }

    const legacy = clothesCacheKeys.legacyAll(auth0Id);
    if (!matchingKeys.includes(legacy)) {
      matchingKeys.push(legacy);
    }

    if (matchingKeys.length > 0 && typeof r.del === "function") {
      await r.del(...matchingKeys);
    }

    const durationMs = timer.elapsedMs();
    observeMs("wardrobe_cache_invalidated.ms", durationMs);
    incMetric("wardrobe_cache_invalidated.keys", matchingKeys.length);
    logInfo("wardrobe_cache_invalidated", {
      keyCount: matchingKeys.length,
      durationMs,
      pattern,
    });

    return { deleted: matchingKeys.length, durationMs, ok: true };
  } catch (err) {
    const durationMs = timer.elapsedMs();
    logWarn("wardrobe_cache_invalidation_failed", {
      durationMs,
      errorMessage: err?.message,
    });
    return { deleted: 0, durationMs, ok: false };
  }
};

/** Invalidate outfit list cache for a user (best-effort). */
export const invalidateUserOutfitsCache = async (auth0Id) => {
  if (!auth0Id) return { ok: true };
  try {
    if (typeof redis.del === "function") {
      await redis.del(outfitCacheKeys.all(auth0Id));
    }
    return { ok: true };
  } catch (err) {
    logWarn("outfit_cache_invalidation_failed", {
      errorMessage: err?.message,
    });
    return { ok: false };
  }
};

/**
 * Resolve auth0Id from a Mongo userId ObjectId, then invalidate clothes caches.
 * Used by enrichment paths that only know userId.
 */
export const invalidateClothesCacheForUserId = async (userId) => {
  try {
    const { User } = await import("../models/Users.js");
    const user = await User.findById(userId).select("auth0Id").lean();
    if (!user?.auth0Id) return { ok: true, deleted: 0 };
    return invalidateUserClothesCache(user.auth0Id);
  } catch (err) {
    logWarn("wardrobe_cache_invalidation_failed", {
      errorMessage: err?.message,
      reason: "userId_lookup",
    });
    return { ok: false, deleted: 0 };
  }
};
