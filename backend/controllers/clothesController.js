import User from "../models/Users.js";
import mongoose from "mongoose";
import connectMongoDB from "../libs/mongodb.js";
import multer from "multer";
import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.UPSTASH_REDIS_URL;

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
    // if connect succeeded, use the real client
    redis = realClient;
  }
}

export { redis };

export const removeData = async (request, response) => {
  console.log("delete");
  try {
    const { auth0Id, uniqueId } = request.body;
    await connectMongoDB();

    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $pull: { Clothes: { _id: uniqueId } } },
      { new: true }
    );

    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    return response.json({
      message: "Clothing item removed successfully",
      clothes: user.Clothes,
    });
  } catch (e) {
    return response
      .status(500)
      .json({ error: "Failed to remove clothing item", details: e.message });
  }
};

export const getData = async (request, response) => {
  console.log("List clothes");
  try {
    const { auth0Id } = request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }

    // Redis cache key
    const redisKey = `userData:${auth0Id}`;

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
    const userData = await User.findOne({ auth0Id }, { Clothes: 1, _id: 0 });
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

const toBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`; // Convert buffer to Base64 string
};

// Middleware for handling file upload route
export const uploadMiddleware = upload.single("image");

export const createOutfit = async (request, response) => {
  console.log("Creating Outfit");
  try {
    const { auth0Id, name, colour, season, waterproof, outfit_items } =
      request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }

    const parsedItems = (() => {
      try {
        return JSON.parse(outfit_items || "[]");
      } catch (_) {
        return [];
      }
    })();

    const parsedColour = (() => {
      try {
        return JSON.parse(colour || "[]");
      } catch (_) {
        return [];
      }
    })();

    const parsedSeason = (() => {
      try {
        return JSON.parse(season || "[]");
      } catch (_) {
        return [];
      }
    })();

    // Normalize items to align with ClothesSchema fields
    const normalizedItems = parsedItems.map((item) => ({
      uniqueId: String(
        item.uniqueId || item._id || new mongoose.Types.ObjectId()
      ),
      type: item.type,
      imageSrc: item.imageSrc,
      favourite: Boolean(item.favourite) || false,
      colour: Array.isArray(item.colour) ? item.colour : [],
      seaon: Array.isArray(item.seaon) ? item.seaon : [],
      waterproof: Boolean(item.waterproof) || false,
    }));

    await connectMongoDB();

    const newOutfit = {
      uniqueId: new mongoose.Types.ObjectId().toString(),
      name: name || "",
      favourite: false,
      colour: parsedColour,
      seaon: parsedSeason, // Match schema's current field name
      waterproof: waterproof === "true" || Boolean(waterproof),
      outfit_items: normalizedItems,
    };

    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $push: { outfits: newOutfit } },
      { new: true }
    );

    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    return response
      .status(200)
      .json({ message: "Outfit created successfully", outfits: user.outfits });
  } catch (e) {
    console.error(e);
    return response
      .status(500)
      .json({ error: "Failed to create outfit", details: e.message });
  }
};

export const uploadData = async (request, response) => {
  console.log("Uploading");
  console.log(request.body);

  try {
    const { auth0Id, type, colour } = request.body; // Other clothing data
    const file = request.file; // Multer adds the uploaded file in request.file
    console.log(type);
    if (!file) {
      console.log("no file");
      return response.status(400).json({ error: "No file uploaded" });
    }
    console.log("yes file");

    const imageSrc = await toBase64(file);
    console.log("next move");

    await connectMongoDB();

    const newClothingItem = {
      type,
      imageSrc,
      colour: JSON.parse(colour), // Convert stringified array to array
    };
    const user = await User.findOneAndUpdate(
      { auth0Id },
      { $push: { Clothes: newClothingItem } },
      { new: true }
    );

    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    return response
      .status(200)
      .json({ message: "Clothes added successfully", user });
  } catch (e) {
    console.error(e);
    return response
      .status(500)
      .json({ error: "Failed to add clothes", details: e.message });
  }
};

// const toBase64 = (file) =>
//   new Promise((resolve, reject) => {
//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => resolve(reader.result);
//     reader.onerror = (error) => reject(error);
//   });

// export const uploadData = async (request, response) => {
//   console.log("Uploading");

//   try {
//     const { auth0Id, Clothes } = request.body;

//     console.log(Clothes);
//     const file = Clothes.imageSrc;
//     console.log(file);
//     console.log(" ");
//     console.log(" ");
//     console.log(" ");
//     console.log(" below   ??");
//     console.log(" ");

//     const base64File = await toBase64(file);
//     console.log(base64File);
//     console.log(" ");
//     console.log(" ");
//     console.log("above");

//     Clothes.imageSrc = base64File;
//     await connectMongoDB();
//     addData(Clothes);

//     const user = await User.findOneAndUpdate(
//       { auth0Id: auth0Id },
//       { $push: { Clothes: Clothes } },
//       { new: true }
//     );
//     return response.status(200).json({ message: "Clothes Added", user });
//   } catch (e) {
//     return response.status(500).json({ error: "Failed to add clothes", e });
//   }
// };
