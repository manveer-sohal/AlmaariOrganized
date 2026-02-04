import { toBase64 } from "../services/image.service.js";
import { cropImage } from "../services/image.service.js";
import { mapTypeToSlot } from "../utils/slot.utils.js";
import { User } from "../models/Users.js";
import mongoose from "mongoose";
import { Clothes } from "../models/Users.js";
import { redis } from "../libs/redis.client.js";

export const removeData = async ({ auth0Id, uniqueId, clothingId }) => {
  try {
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

    if (!clothingDoc) {
      throw { status: 404, message: "Clothing item not found" };
    }

    // Remove clothing reference from user and any outfits, then delete the doc
    await Promise.all([
      User.findOneAndUpdate(
        { auth0Id },
        { $pull: { clothes: clothingDoc._id } },
        { new: true }
      ),
      Outfits.updateMany(
        { outfit_items: clothingDoc._id },
        { $pull: { outfit_items: clothingDoc._id } }
      ),
      Clothes.deleteOne({ _id: clothingDoc._id }),
    ]);

    const updatedUser = await User.findOne(
      { auth0Id },
      { _id: 0, clothes: 1 }
    ).populate("clothes");

    await redis.del("userClothes:" + auth0Id);

    return {
      message: "Clothing item removed successfully",
      Clothes: updatedUser?.clothes || [],
    };
  } catch (e) {
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
}) => {
  try {
    const slot = mapTypeToSlot(type);
    const userId = await User.findOne({ auth0Id });
    if (!userId) {
      throw { status: 404, error: "User Not Found" };
    }

    let imageSrc = await toBase64(file.buffer);
    console.log("imageSrc", imageSrc);

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
    });

    const user = await User.findOneAndUpdate(
      { auth0Id },
      {
        $push: { clothes: clothingDoc._id },
        $set: { hasCompletedOnboardingForClothes: true },
      },
      { new: true }
    );

    if (!user) {
      throw { status: 404, error: "User Not Found" };
    }

    return {
      status: 200,
      message: "Clothes added successfully",
      clothing: clothingDoc,
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
    const outfit = await Outfits.findOneAndDelete({ uniqueId });
    if (!outfit) {
      throw { status: 404, message: "Outfit not found" };
    }
    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $pull: { outfits: outfit._id } },
      { new: true }
    );
    if (!user) {
      throw { status: 404, message: "User not found" };
    }
    return {
      status: 200,
      message: "Outfit deleted successfully",
      outfit: outfit,
    };
  } catch (e) {
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
      { outfits: 1, _id: 0 }
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
        err
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
  console.log("List clothes");

  // Redis cache key
  const redisKey = `userClothes:${auth0Id}`;

  // Check cache for the data (safe fallback if Redis unavailable)
  let cachedData = null;
  try {
    cachedData = await redis.get(redisKey);
  } catch (err) {
    console.warn("Redis get failed, continuing without cache:", err);
  }
  if (cachedData) {
    console.log("Cache hit: Returning cached data");
    return { status: 200, clothes: JSON.parse(cachedData) }; // Send cached data
  }

  const skip = (page - 1) * numberOfClothes;
  const limit = numberOfClothes;

  // Measure MongoDB query time
  const startTime = Date.now();
  console.log("auth0Id", auth0Id);
  const userId = await User.findOne({ auth0Id }, { _id: 1 });
  if (!userId) {
    console.log("User Not Found");
    throw { status: 404, error: "User Not Found" };
  }

  const userData = await Clothes.find({ userId: userId._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const endTime = Date.now();
  console.log(`Query took ${endTime - startTime} ms`);

  // Store the data in Redis cache with a TTL (best-effort)
  try {
    await redis.set(redisKey, JSON.stringify({ Clothes: userData || [] }), {
      EX: 600,
    });
    console.log("Cache miss: Queried MongoDB and cached the result");
  } catch (err) {
    console.warn(
      "Redis set failed, returning Mongo result without caching:",
      err
    );
  }
  console.log("it worked");
  return {
    status: 200,
    clothes: userData || [],
    message: "Clothes fetched successfully",
  };
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

    // Extract clothing ObjectIds from provided items (supports _id or uniqueId)
    const stringOrObjectItems = Array.isArray(parsedItems) ? parsedItems : [];
    const candidateObjectIds = [];
    for (const it of stringOrObjectItems) {
      if (it) {
        for (const item of it._id) {
          candidateObjectIds.push(item);
        }
      }
    }

    const createdOutfit = await Outfits.create({
      uniqueId: new mongoose.Types.ObjectId().toString(),
      name: name || "",
      favourite: false,
      colour: parsedColour,
      season: parsedSeason,
      waterproof: waterproof === "true" || Boolean(waterproof),
      outfit_items: candidateObjectIds,
    });

    const user = await User.findOneAndUpdate(
      { auth0Id },
      {
        $push: { outfits: createdOutfit._id },
        $set: { hasCompletedOnboardingForOutfits: true },
      },
      { new: true }
    );
    if (!user) {
      throw { status: 404, message: "User not found" };
    }

    return {
      status: 200,
      message: "Outfit created successfully",
      outfit: createdOutfit,
    };
  } catch (e) {
    console.error(e);
    throw {
      status: 500,
      message: "Failed to create outfit",
      details: e.message || null,
    };
  }
};
