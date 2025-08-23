import User from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";
import multer from "multer";
import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
dotenv.config();

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

//pass in url after for production
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const getData = async (request, response) => {
  try {
    const { auth0Id } = request.body;

    if (!auth0Id) {
      return response.status(400).json({ error: "auth0Id is required" });
    }

    // Redis cache key
    const redisKey = `userData:${auth0Id}`;

    // Check cache for the data
    const cachedData = await redis.get(redisKey);
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

    // Store the data in Redis cache with a TTL (e.g., 600 seconds = 10 minutes)
    await redis.set(redisKey, JSON.stringify(userData), {
      ex: 600, // 10-minute expiry time (Upstash REST uses lowercase 'ex')
    });

    console.log("Cache miss: Queried MongoDB and cached the result");
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
