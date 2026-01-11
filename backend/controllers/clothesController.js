import { User, Clothes, Outfits } from "../models/Users.js";
import mongoose from "mongoose";
import connectMongoDB from "../libs/mongodb.js";
import multer from "multer";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

let redis;
let _redisDnsErrorLogged = false; // dedupe DNS error logs

if (!redisUrl) {
  console.warn(
    "UPSTASH_REDIS_URL is missing. Caching will be disabled and the app will fall back to MongoDB."
  );
  redis = {
    isOpen: false,
    on: () => {},
    connect: async () => {},
    ping: async () => {},
    get: async () => null,
    set: async () => {},
  };
} else {
  // Real Redis client
  const realClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        // backoff a bit, but stop trying after 3 attempts
        if (retries > 3) return new Error("Stop reconnecting to Redis");
        return Math.min(retries * 500, 2000);
      },
    },
  });

  realClient.on("error", (err) => {
    // Avoid spamming logs on DNS failures
    if (err && err.code === "ENOTFOUND") {
      if (!_redisDnsErrorLogged) {
        console.error("Redis client DNS error (once):", err);
        _redisDnsErrorLogged = true;
      }
      return; // swallow further repeats
    }
    console.error("Redis client error:", err);
  });

  try {
    if (!realClient.isOpen) {
      await realClient.connect();
      await realClient.ping();
      console.log("✅ Redis connected");
    }
  } catch (err) {
    console.error("Failed to connect to Redis. Continuing without cache:", err);
    // Stop the real client and remove listeners to prevent further error spam
    try {
      await realClient.quit();
    } catch (_) {
      /* ignore */
    }
    try {
      realClient.removeAllListeners && realClient.removeAllListeners();
    } catch (_) {
      /* ignore */
    }
    // Swap in a no-op shim so subsequent calls don't throw
    redis = {
      isOpen: false,
      on: () => {},
      connect: async () => {},
      ping: async () => {},
      get: async () => null,
      set: async () => {},
    };
  }
  if (!redis) {
    // if connect succeeded, use the real clilent
    redis = realClient;
  }
}

export { redis };

export const removeData = async (request, response) => {
  console.log("delete");
  try {
    const { auth0Id, uniqueId, clothingId } = request.body;
    await connectMongoDB();

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
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
        clothingDoc = await Clothes.findOne({ uniqueId: String(uniqueId) });
      }
    }

    if (!clothingDoc) {
      return response.status(404).json({ error: "Clothing item not found" });
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

    const deletedCount1 = await redis.del("userClothes:" + auth0Id);
    console.log("deletedCount1", deletedCount1);

    // const deletedCount2 = await redis.del("userOutfits:" + auth0Id);

    return response.json({
      message: "Clothing item removed successfully",
      Clothes: updatedUser?.clothes || [],
    });
  } catch (e) {
    return response
      .status(500)
      .json({ error: "Failed to remove clothing item", details: e.message });
  }
};
export const getOutfits = async (request, response) => {
  console.log("List outfits");
  try {
    const { auth0Id } = request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }

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
      return response.status(200).json(JSON.parse(cachedData)); // Send cached data
    }

    await connectMongoDB();

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
      return response.status(404).json({ error: "User Not Found" });
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
    return response.status(200).json(userData);
  } catch (e) {
    console.error(e);
    return response
      .status(500)
      .json({ error: "Failed to fetch user data", details: e.message });
  }
};

export const getData = async (request, response) => {
  console.log("List clothes");
  try {
    const { auth0Id } = request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }
    console.log(auth0Id);

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
      return response.status(200).json(JSON.parse(cachedData)); // Send cached data
    }

    await connectMongoDB();

    // Measure MongoDB query time
    const startTime = Date.now();

    const userData = await User.findOne(
      { auth0Id },
      { clothes: 1, _id: 0 }
    ).populate("clothes");

    const endTime = Date.now();
    console.log(`Query took ${endTime - startTime} ms`);

    if (!userData) {
      console.log("User Not Found");
      return response.status(404).json({ error: "User Not Found" });
    }

    // Store the data in Redis cache with a TTL (best-effort)
    try {
      await redis.set(
        redisKey,
        JSON.stringify({ Clothes: userData.clothes || [] }),
        { EX: 600 }
      );
      console.log("Cache miss: Queried MongoDB and cached the result");
    } catch (err) {
      console.warn(
        "Redis set failed, returning Mongo result without caching:",
        err
      );
    }
    return response.status(200).json({ Clothes: userData.clothes || [] });
  } catch (e) {
    console.error(e);
    return response
      .status(500)
      .json({ error: "Failed to fetch user data", details: e.message });
  }
};

function addData() {
  const cold = [
    "Jeans",
    "Sweater",
    "Jacket",
    "Trousers",
    "Hoodie",
    "Coat",
    "Cardigan",
    "Pajamas",
    "Scarf",
    "Hat",
    "Gloves",
    "Cargos",
    "Jeans",
    "Leggings",
    "Vest",
    "Overalls",
    "Jumper",
    "Pants",
    "Tunic",
    "Poncho",
    "Robe",
  ];
  const warm = [
    "Shirt",
    "Jeans",
    "T-shirt",
    "Shorts",
    "Skirt",
    "Dress",
    "Blouse",
    "Trousers",
    "Cardigan",
    "Tank Top",
    "Pajamas",
    "Socks",
    "Cargos",
    "Jeans",
    "Leggings",
    "Swimsuit",
    "Crop Top",
    "Pants",
    "Capri Pants",
  ];

  const rain = [
    "Sweater",
    "Jacket",
    "Hoodie",
    "Coat",
    "Hat",
    "Swimsuit",
    "Raincoat",
    "Jumper",
    "Poncho",
  ];

  console.log(Clothes.type);
  if (cold.includes(Clothes.type)) {
    console.log("this is good for the cold");
  } else if (rain.includes(Clothes.type)) {
    console.log("this is good for the cold");
  } else if (warm.includes(Clothes.type)) {
    console.log("this is good for the cold");
  }
}

// Configure multer
const upload = multer({ storage: multer.memoryStorage() });

function toBase64(file) {
  return `data:image/png;base64,${file.toString("base64")}`;
}

// Middleware for handling file upload route
export const uploadMiddleware = upload.single("image");

export const createOutfit = async (request, response) => {
  console.log("Creating Outfit");
  try {
    const {
      auth0Id,
      name,
      colour,
      season,
      waterproof,
      outfit_items,
    } = request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }

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
    await connectMongoDB();

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
      return response.status(404).json({ error: "User not found" });
    }

    console.log("createdOutfit", createdOutfit);
    return response.status(200).json({
      message: "Outfit created successfully",
      outfit: createdOutfit,
    });
  } catch (e) {
    console.error(e);
    return response
      .status(500)
      .json({ error: "Failed to create outfit", details: e.message });
  }
};

const mapTypeToSlot = (type) => {
  const t = type.toLowerCase();
  if (
    t.includes("hat") ||
    t.includes("cap") ||
    t.includes("beanie") ||
    t.includes("scarf")
  ) {
    return "head";
  }
  if (
    t.includes("shirt") ||
    t.includes("t-shirt") ||
    t.includes("tee") ||
    t.includes("hoodie") ||
    t.includes("jacket") ||
    t.includes("coat") ||
    t.includes("sweater") ||
    t.includes("jumper") ||
    t.includes("blouse") ||
    t.includes("dress") ||
    t.includes("top") ||
    t.includes("cardigan") ||
    t.includes("vest")
  ) {
    return "body";
  }
  if (
    t.includes("jeans") ||
    t.includes("pants") ||
    t.includes("trousers") ||
    t.includes("leggings") ||
    t.includes("shorts") ||
    t.includes("skirt") ||
    t.includes("cargos") ||
    t.includes("capri")
  ) {
    return "legs";
  }
  if (
    t.includes("shoes") ||
    t.includes("boots") ||
    t.includes("sneakers") ||
    t.includes("sandals") ||
    t.includes("heels") ||
    t.includes("socks")
  ) {
    return "feet";
  }
  return "body";
};

export const uploadData = async (request, response) => {
  console.log("Uploading");
  // console.log(request.body);

  try {
    const {
      auth0Id,
      type,
      colour,
      season,
      waterproof,
      favourite,
    } = request.body; // Other clothing data
    const file = request.file; // Multer adds the uploaded file in request.file
    console.log(type);
    if (!file) {
      console.log("no file");
      return response.status(400).json({ error: "No file uploaded" });
    }
    console.log("yes file");

    // const cropped_image = await sharp(file.buffer)
    //   .resize(500, 120)
    //   .toBuffer();

    // const imageSrc = toBase64(cropped_image);

    const imageSrc = toBase64(file.buffer);
    console.log("next move");

    await connectMongoDB();

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

    const slot = mapTypeToSlot(type);

    const clothingDoc = await Clothes.create({
      uniqueId: new mongoose.Types.ObjectId().toString(),
      type,
      imageSrc,
      favourite: favourite === "true" || Boolean(favourite),
      colour: parsedColour,
      season: parsedSeason,
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

    console.log("user upload clothes", user);
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    return response.status(200).json({
      message: "Clothes added successfully",
      clothing: clothingDoc,
    });
  } catch (e) {
    console.error(e);
    return response
      .status(500)
      .json({ error: "Failed to add clothes", details: e.message });
  }
};

export const deleteOutfit = async (request, response) => {
  console.log("Deleting Outfit");
  try {
    const { auth0Id, uniqueId } = request.body;
    await connectMongoDB();
    const outfit = await Outfits.findOneAndDelete({ uniqueId });
    if (!outfit) {
      return response.status(404).json({ error: "Outfit not found" });
    }
    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $pull: { outfits: outfit._id } },
      { new: true }
    );
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }
    return response.status(200).json({
      message: "Outfit deleted successfully",
      outfit: outfit,
    });
  } catch (e) {
    console.error(e);
    return response
      .status(500)
      .json({ error: "Failed to delete outfit", details: e.message });
  }
};
