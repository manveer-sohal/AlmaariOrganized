import { toBase64 } from "../services/image.service.js";
import { cropImage } from "../services/image.service.js";
import { mapTypeToSlot } from "../utils/slot.utils.js";
import { User } from "../models/Users.js";
import mongoose from "mongoose";
import { Clothes } from "../models/Users.js";
import { Outfits } from "../models/Users.js";
import { redis } from "../libs/redis.client.js";
import {
  scheduleStylingEnrichment,
  updateUserStyleDetails,
  applyAiStylingEnrichment,
} from "./stylingEnrichment.service.js";
import {
  OCCASION_TAGS,
  STYLE_CATEGORIES,
} from "../constants/clothingMetadata.js";
import {
  defaultStylingMetadata,
  normalizeClothingAnalysisResponse,
  clampFormalityToStyleCategory,
} from "../utils/normalizeClothingAnalysisResponse.js";
import { SAMPLE_WARDROBE_ITEMS } from "../data/sampleWardrobe.js";

const USER_OBJECT_ID_CACHE_TTL = 3600;

const resolveUserObjectId = async (auth0Id) => {
  const cacheKey = `userObjectId:${auth0Id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return new mongoose.Types.ObjectId(cached);
    }
  } catch (err) {
    console.warn("Redis userObjectId get failed:", err);
  }

  const user = await User.findOne({ auth0Id }, { _id: 1 }).lean();
  if (!user?._id) {
    return null;
  }

  try {
    await redis.set(cacheKey, user._id.toString(), {
      EX: USER_OBJECT_ID_CACHE_TTL,
    });
  } catch (err) {
    console.warn("Redis userObjectId set failed:", err);
  }

  return user._id;
};

// Helper to invalidate all userClothes cache keys for a user (any page/limit)
const invalidateUserClothesCache = async (auth0Id) => {
  try {
    const matchingKeys = [];
    for await (const key of redis.scanIterator({
      MATCH: `userClothes:${auth0Id}:*`,
      COUNT: 100,
    })) {
      matchingKeys.push(key);
    }
    if (matchingKeys.length > 0) {
      await redis.del(matchingKeys);
    }
    // Remove the pre-pagination legacy key as well.
    await redis.del(`userClothes:${auth0Id}`);
  } catch (err) {
    console.warn("Redis clothes cache invalidation failed:", err);
  }
};

const resolveClothingDoc = async ({ clothingId, uniqueId }) => {
  if (clothingId) {
    return Clothes.findById(clothingId);
  }
  if (uniqueId) {
    const objectIdLike = /^(?=.*[a-f\d])[a-f\d]{24}$/i;
    if (objectIdLike.test(String(uniqueId))) {
      const byId = await Clothes.findById(uniqueId);
      if (byId) return byId;
    }
    return Clothes.findOne({ uniqueId: String(uniqueId) });
  }
  return null;
};

export const removeData = async ({ auth0Id, uniqueId, clothingId }) => {
  try {
    const user = await User.findOne({ auth0Id });
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    const clothingDoc = await resolveClothingDoc({ clothingId, uniqueId });

    if (!clothingDoc || String(clothingDoc.userId) !== String(user._id)) {
      throw { status: 404, message: "Clothing item not found" };
    }

    // Remove clothing reference from user and any outfits, then delete the doc
    await Promise.all([
      User.findOneAndUpdate(
        { auth0Id },
        { $pull: { clothes: clothingDoc._id } },
        { new: true },
      ),
      Outfits.updateMany(
        { outfit_items: clothingDoc._id },
        { $pull: { outfit_items: clothingDoc._id } },
      ),
      Clothes.deleteOne({ _id: clothingDoc._id }),
    ]);

    const updatedUser = await User.findOne(
      { auth0Id },
      { _id: 0, clothes: 1 },
    ).populate("clothes");

    await invalidateUserClothesCache(auth0Id);
    await redis.del("userOutfits:" + auth0Id);
    return {
      message: "Clothing item removed successfully",
      Clothes: updatedUser?.clothes || [],
    };
  } catch (e) {
    if (e.status) throw e;
    throw {
      status: 500,
      message: "Failed to remove clothing item",
      details: e.message,
    };
  }
};

export const uploadData = async ({
  auth0Id,
  type,
  colour,
  season,
  waterproof,
  favourite,
  file,
  material,
  fit,
  pattern,
  imageAlreadyCropped = false,
  styleCategory = undefined,
  occasionTags = undefined,
  analysisSnapshot = undefined,
}) => {
  try {
    const slot = mapTypeToSlot(type);
    const userId = await User.findOne({ auth0Id });
    if (!userId) {
      throw { status: 404, error: "User Not Found" };
    }

    let imageSrc = await toBase64(file.buffer);
    console.log("imageSrc", imageSrc);

    if (!imageAlreadyCropped) {
      try {
        imageSrc = await cropImage(imageSrc);
        imageSrc = "data:image/png;base64," + imageSrc;
      } catch (e) {
        throw {
          status: 500,
          message: "Error cropping image",
          details: e.message,
        };
      }
    }

    const stylingMetadata = defaultStylingMetadata();

    // User edits from the form (override AI snapshot for those fields).
    const userSetCategory = styleCategory != null && styleCategory !== "";
    const userSetOccasions = Array.isArray(occasionTags);

    if (userSetCategory) {
      if (!STYLE_CATEGORIES.includes(styleCategory)) {
        throw { status: 400, message: "Invalid styleCategory" };
      }
      stylingMetadata.styleCategory = styleCategory;
      stylingMetadata.styleCategorySource = "user";
      stylingMetadata.formalityScore = clampFormalityToStyleCategory(
        styleCategory,
        stylingMetadata.formalityScore,
      );
    }

    if (userSetOccasions) {
      const cleaned = [];
      const seen = new Set();
      for (const tag of occasionTags) {
        if (!OCCASION_TAGS.includes(tag)) {
          throw { status: 400, message: `Invalid occasionTag: ${tag}` };
        }
        if (seen.has(tag)) continue;
        seen.add(tag);
        cleaned.push(tag);
      }
      stylingMetadata.occasionTags = cleaned;
      stylingMetadata.occasionTagsSource = "user";
    }

    if (userSetCategory || userSetOccasions) {
      stylingMetadata.userReviewedAt = new Date();
    }

    let normalizedSnapshot = null;
    if (analysisSnapshot && typeof analysisSnapshot === "object") {
      normalizedSnapshot = normalizeClothingAnalysisResponse(analysisSnapshot);
    }

    const clothingDoc = await Clothes.create({
      userId: userId._id,
      uniqueId: new mongoose.Types.ObjectId().toString(),
      type,
      imageSrc,
      favourite: favourite === "true" || Boolean(favourite),
      colour,
      season,
      waterproof: waterproof === "true" || Boolean(waterproof),
      slot,
      material,
      fit,
      pattern,
      stylingMetadata,
    });

    const user = await User.findOneAndUpdate(
      { auth0Id },
      {
        $push: { clothes: clothingDoc._id },
        $set: { hasCompletedOnboardingForClothes: true },
      },
      { new: true },
    );

    if (!user) {
      throw { status: 404, error: "User Not Found" };
    }

    try {
      await invalidateUserClothesCache(auth0Id);
    } catch (err) {
      console.warn("Redis delete failed after clothing upload:", err);
    }

    // Reuse the pre-upload FastAPI analysis when present — never charge credits twice.
    // If the snapshot has no rich styling fields, still schedule background enrichment
    // so pending items do not stay stuck forever.
    if (normalizedSnapshot) {
      const applied = await applyAiStylingEnrichment({
        clothingId: clothingDoc._id,
        analysis: normalizedSnapshot,
      });
      if (!applied.rich) {
        scheduleStylingEnrichment(clothingDoc._id);
      }
    } else {
      // No prior analysis — one background FastAPI call for rich styling.
      scheduleStylingEnrichment(clothingDoc._id);
    }

    const refreshed = await Clothes.findById(clothingDoc._id);

    return {
      status: 200,
      message: "Clothes added successfully",
      clothing: refreshed || clothingDoc,
    };
  } catch (e) {
    if (e.status) throw e;
    else {
      throw { status: 500, error: "Failed to add clothes", details: e.message };
    }
  }
};

export const deleteOutfit = async ({ auth0Id, uniqueId }) => {
  try {
    const user = await User.findOne({ auth0Id });
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    const outfit = await Outfits.findOne({ uniqueId });
    if (!outfit) {
      throw { status: 404, message: "Outfit not found" };
    }

    const ownsOutfit = user.outfits.some(
      (id) => String(id) === String(outfit._id),
    );
    if (!ownsOutfit) {
      throw { status: 404, message: "Outfit not found" };
    }

    await Promise.all([
      Outfits.deleteOne({ _id: outfit._id }),
      User.findOneAndUpdate(
        { auth0Id },
        { $pull: { outfits: outfit._id } },
        { new: true },
      ),
    ]);

    try {
      await redis.del("userOutfits:" + auth0Id);
    } catch (err) {
      console.warn("Redis delete failed after outfit delete:", err);
    }

    return {
      status: 200,
      message: "Outfit deleted successfully",
      outfit,
    };
  } catch (e) {
    if (e.status) throw e;
    throw {
      status: 500,
      message: "Failed to delete outfit",
      details: e.message,
    };
  }
};
export const getOutfits = async ({ auth0Id }) => {
  try {
    // Redis cache key
    const redisKey = `userOutfits:${auth0Id}`;

    // Check cache for the data (safe fallback if Redis unavailable)
    let cachedData = null;
    try {
      cachedData = await redis.get(redisKey);
    } catch (err) {
      console.warn("Redis get failed, continuing without cache:", err);
    }
    if (cachedData) {
      console.log("Cache hit: Returning cached data");
      return { status: 200, outfits: JSON.parse(cachedData) }; // Send cached data
    }

    // Measure MongoDB query time
    const startTime = Date.now();
    const userData = await User.findOne(
      { auth0Id },
      { outfits: 1, _id: 0 },
    ).populate({
      path: "outfits",
      populate: { path: "outfit_items", model: "Clothes" },
    });
    const endTime = Date.now();
    console.log(`Query took ${endTime - startTime} ms`);

    if (!userData) {
      throw { status: 404, message: "User Not Found" };
    }

    // Store the data in Redis cache with a TTL (best-effort)
    try {
      await redis.set(redisKey, JSON.stringify(userData), { EX: 600 });
      console.log("Cache miss: Queried MongoDB and cached the result");
    } catch (err) {
      console.warn(
        "Redis set failed, returning Mongo result without caching:",
        err,
      );
    }
    return { status: 200, outfits: userData };
  } catch (e) {
    console.error(e);
    throw {
      status: 500,
      message: "Failed to fetch user data",
      details: e.message,
    };
  }
};

export const getData = async ({ auth0Id, numberOfClothes = 40, page = 1 }) => {
  const redisKey = `userClothes:${auth0Id}:page:${page}:limit:${numberOfClothes}`;

  let cachedData = null;
  try {
    cachedData = await redis.get(redisKey);
  } catch (err) {
    console.warn("Redis get failed, continuing without cache:", err);
  }
  if (cachedData) {
    const parsedCache = JSON.parse(cachedData);
    const cachedClothes = Array.isArray(parsedCache)
      ? parsedCache
      : Array.isArray(parsedCache?.Clothes)
        ? parsedCache.Clothes
        : [];

    return {
      status: 200,
      clothes: cachedClothes,
      message: "Clothes fetched successfully",
    };
  }

  const skip = (page - 1) * numberOfClothes;
  const limit = numberOfClothes;

  const userObjectId = await resolveUserObjectId(auth0Id);
  if (!userObjectId) {
    throw { status: 404, error: "User Not Found" };
  }

  const userData = await Clothes.find({ userId: userObjectId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  try {
    await redis.set(redisKey, JSON.stringify(userData || []), {
      EX: 600,
    });
  } catch (err) {
    console.warn(
      "Redis set failed, returning Mongo result without caching:",
      err,
    );
  }

  return {
    status: 200,
    clothes: userData || [],
    message: "Clothes fetched successfully",
  };
};

export const updateClothing = async ({
  auth0Id,
  uniqueId,
  clothingId,
  updates,
}) => {
  try {
    const user = await User.findOne({ auth0Id });
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    let clothingDoc = null;

    if (clothingId) {
      clothingDoc = await Clothes.findById(clothingId);
    } else if (uniqueId) {
      const objectIdLike = /^(?=.*[a-f\d])[a-f\d]{24}$/i;
      if (objectIdLike.test(String(uniqueId))) {
        clothingDoc = await Clothes.findById(uniqueId);
      }
      if (!clothingDoc) {
        clothingDoc = await Clothes.findOne({
          uniqueId: String(uniqueId),
        });
      }
    }

    if (!clothingDoc || String(clothingDoc.userId) !== String(user._id)) {
      throw { status: 404, message: "Clothing item not found" };
    }

    clothingDoc.type = updates.type;
    clothingDoc.colour = updates.colour;
    clothingDoc.material = updates.material;
    clothingDoc.fit = updates.fit;
    clothingDoc.pattern = updates.pattern;
    clothingDoc.slot = updates.slot;

    await clothingDoc.save();

    if (
      updates.styleCategory !== undefined ||
      updates.occasionTags !== undefined
    ) {
      clothingDoc = await updateUserStyleDetails({
        clothingId: clothingDoc._id,
        userId: user._id,
        styleCategory: updates.styleCategory,
        occasionTags: updates.occasionTags,
      });
    }

    try {
      await invalidateUserClothesCache(auth0Id);
      await redis.del("userOutfits:" + auth0Id);
    } catch (err) {
      console.warn("Redis delete failed after clothing update:", err);
    }

    return {
      status: 200,
      message: "Clothing item updated successfully",
      clothing: clothingDoc,
    };
  } catch (e) {
    if (e.status) throw e;
    throw {
      status: 500,
      message: "Failed to update clothing item",
      details: e.message,
    };
  }
};

export const replaceClothingImage = async ({
  auth0Id,
  uniqueId,
  clothingId,
  file,
  imageAlreadyCropped = true,
}) => {
  try {
    const user = await User.findOne({ auth0Id });
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    let clothingDoc = null;

    if (clothingId) {
      clothingDoc = await Clothes.findById(clothingId);
    } else if (uniqueId) {
      const objectIdLike = /^(?=.*[a-f\d])[a-f\d]{24}$/i;
      if (objectIdLike.test(String(uniqueId))) {
        clothingDoc = await Clothes.findById(uniqueId);
      }
      if (!clothingDoc) {
        clothingDoc = await Clothes.findOne({
          uniqueId: String(uniqueId),
        });
      }
    }

    if (!clothingDoc || String(clothingDoc.userId) !== String(user._id)) {
      throw { status: 404, message: "Clothing item not found" };
    }

    if (clothingDoc.isSample) {
      throw {
        status: 400,
        message: "Sample wardrobe items cannot be re-cropped",
      };
    }

    let imageSrc = await toBase64(file.buffer);

    if (!imageAlreadyCropped) {
      try {
        imageSrc = await cropImage(imageSrc);
        imageSrc = "data:image/png;base64," + imageSrc;
      } catch (e) {
        throw {
          status: 500,
          message: "Error cropping image",
          details: e.message,
        };
      }
    }

    clothingDoc.imageSrc = imageSrc;
    await clothingDoc.save();

    try {
      await invalidateUserClothesCache(auth0Id);
      await redis.del("userOutfits:" + auth0Id);
    } catch (err) {
      console.warn("Redis delete failed after clothing image replace:", err);
    }

    return {
      status: 200,
      message: "Clothing image updated successfully",
      clothing: clothingDoc,
    };
  } catch (e) {
    if (e.status) throw e;
    throw {
      status: 500,
      message: "Failed to update clothing image",
      details: e.message,
    };
  }
};

export const createOutfit = async ({
  auth0Id,
  name,
  colour,
  season,
  waterproof,
  outfit_items,
}) => {
  try {
    const parsedItems = (() => {
      try {
        return JSON.parse(outfit_items || "[]");
      } catch (_) {
        return Array.isArray(outfit_items) ? outfit_items : [];
      }
    })();

    const parsedColour = (() => {
      try {
        return JSON.parse(colour || "[]");
      } catch (_) {
        return Array.isArray(colour) ? colour : [];
      }
    })();

    const parsedSeason = (() => {
      try {
        return JSON.parse(season || "[]");
      } catch (_) {
        return Array.isArray(season) ? season : [];
      }
    })();

    const user = await User.findOne({ auth0Id });
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    // Extract clothing ObjectIds from provided items (supports _id or uniqueId)
    const stringOrObjectItems = Array.isArray(parsedItems) ? parsedItems : [];
    const candidateObjectIds = [];
    for (const it of stringOrObjectItems) {
      if (it && Array.isArray(it._id)) {
        for (const item of it._id) {
          candidateObjectIds.push(item);
        }
      }
    }

    const uniqueItemIds = [...new Set(candidateObjectIds.map(String))];
    if (uniqueItemIds.length === 0) {
      throw { status: 400, message: "At least one outfit item is required" };
    }

    const ownedCount = await Clothes.countDocuments({
      _id: { $in: uniqueItemIds },
      userId: user._id,
    });
    if (ownedCount !== uniqueItemIds.length) {
      throw {
        status: 403,
        message: "One or more clothing items do not belong to you",
      };
    }

    const createdOutfit = await Outfits.create({
      uniqueId: new mongoose.Types.ObjectId().toString(),
      name: name || "",
      favourite: false,
      colour: parsedColour,
      season: parsedSeason,
      waterproof: waterproof === "true" || Boolean(waterproof),
      outfit_items: uniqueItemIds,
    });

    const updatedUser = await User.findOneAndUpdate(
      { auth0Id },
      {
        $push: { outfits: createdOutfit._id },
        $set: { hasCompletedOnboardingForOutfits: true },
      },
      { new: true },
    );
    if (!updatedUser) {
      throw { status: 404, message: "User not found" };
    }

    try {
      await redis.del("userOutfits:" + auth0Id);
    } catch (err) {
      console.warn("Redis delete failed after outfit create:", err);
    }

    return {
      status: 200,
      message: "Outfit created successfully",
      outfit: createdOutfit,
    };
  } catch (e) {
    console.error(e);
    if (e.status) throw e;
    throw {
      status: 500,
      message: "Failed to create outfit",
      details: e.message || null,
    };
  }
};

const buildSampleStylingMetadata = (meta) => {
  const now = new Date();
  return {
    ...defaultStylingMetadata(),
    styleCategory: meta.styleCategory,
    occasionTags: meta.occasionTags,
    formalityScore: meta.formalityScore,
    statementLevel: meta.statementLevel,
    outfitRole: meta.outfitRole,
    subtype: meta.subtype ?? null,
    confidence: {
      type: 1,
      colour: 1,
      material: 1,
      fit: 1,
      pattern: 1,
      styleCategory: 1,
      occasionTags: 1,
      formalityScore: 1,
      statementLevel: 1,
      outfitRole: 1,
      subtype: 1,
    },
    styleCategorySource: "user",
    occasionTagsSource: "user",
    enrichmentStatus: "completed",
    enrichmentError: null,
    enrichedAt: now,
    processingStartedAt: null,
    lastRetryAt: null,
    enrichmentAttemptCount: 0,
    userReviewedAt: now,
  };
};

/**
 * Seed the shared sample wardrobe into the current user's clothes.
 * Idempotent by imageSrc: existing samples are kept; only missing catalog
 * items are inserted (so catalog additions like shoes can be synced).
 */
export const seedSampleWardrobe = async ({ auth0Id }) => {
  try {
    const user = await User.findOne({ auth0Id });
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    const existing = await Clothes.find({
      userId: user._id,
      isSample: true,
    }).lean();

    const existingSrcs = new Set(existing.map((item) => item.imageSrc));
    const missingItems = SAMPLE_WARDROBE_ITEMS.filter(
      (item) => !existingSrcs.has(item.imageSrc),
    );

    if (missingItems.length === 0) {
      return {
        status: 200,
        message: "Sample wardrobe already loaded",
        created: false,
        count: existing.length,
        clothes: existing,
      };
    }

    const docs = missingItems.map((item) => {
      const uniqueId = new mongoose.Types.ObjectId().toString();
      return {
        userId: user._id,
        uniqueId,
        type: item.type,
        imageSrc: item.imageSrc,
        favourite: false,
        isSample: true,
        colour: item.colour,
        season: [],
        waterproof: false,
        slot: item.slot || mapTypeToSlot(item.type),
        material: item.material,
        fit: item.fit,
        pattern: item.pattern,
        stylingMetadata: buildSampleStylingMetadata(item.stylingMetadata),
      };
    });

    const created = await Clothes.insertMany(docs);
    const ids = created.map((c) => c._id);

    await User.findByIdAndUpdate(user._id, {
      $push: { clothes: { $each: ids } },
      $set: { hasCompletedOnboardingForClothes: true },
    });

    await invalidateUserClothesCache(auth0Id);

    const allSamples = [...existing, ...created];
    return {
      status: existing.length > 0 ? 200 : 201,
      message:
        existing.length > 0
          ? "Sample wardrobe updated with new items"
          : "Sample wardrobe added",
      created: true,
      count: allSamples.length,
      clothes: allSamples,
    };
  } catch (e) {
    console.error(e);
    if (e.status) throw e;
    throw {
      status: 500,
      message: "Failed to seed sample wardrobe",
      details: e.message || null,
    };
  }
};

/**
 * Remove only sample wardrobe items for the current user.
 */
export const clearSampleWardrobe = async ({ auth0Id }) => {
  try {
    const user = await User.findOne({ auth0Id });
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    const samples = await Clothes.find({
      userId: user._id,
      isSample: true,
    }).select("_id");

    if (samples.length === 0) {
      return {
        status: 200,
        message: "No sample clothes to remove",
        removed: 0,
      };
    }

    const ids = samples.map((s) => s._id);

    await Promise.all([
      User.findByIdAndUpdate(user._id, { $pullAll: { clothes: ids } }),
      Outfits.updateMany(
        { outfit_items: { $in: ids } },
        { $pull: { outfit_items: { $in: ids } } },
      ),
      Clothes.deleteMany({ _id: { $in: ids } }),
    ]);

    await invalidateUserClothesCache(auth0Id);
    try {
      await redis.del("userOutfits:" + auth0Id);
    } catch (err) {
      console.warn("Redis delete failed after clearing samples:", err);
    }

    return {
      status: 200,
      message: "Sample wardrobe cleared",
      removed: ids.length,
    };
  } catch (e) {
    console.error(e);
    if (e.status) throw e;
    throw {
      status: 500,
      message: "Failed to clear sample wardrobe",
      details: e.message || null,
    };
  }
};
