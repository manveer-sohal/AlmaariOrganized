import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { User, Clothes } from "../models/Users.js";

let mongoServer;

export async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // FORCE test DB
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
}

export async function clearTestDB() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("❌ clearTestDB called outside test environment");
  }

  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
export async function disconnectTestDB() {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function seedTestUserWithClothes() {
  const user = await User.create({
    _id: new mongoose.Types.ObjectId().toString(),
    auth0Id: "test-auth0-id",
    email: "test@example.com",
    clothes: [],
    outfits: [],
  });

  const clothes = await Clothes.create([
    {
      userId: user._id,
      uniqueId: "shirt-1",
      type: "shirt",
      imageSrc: "https://example.com/shirt.png",
      colour: ["blue"],
      slot: "body",
      material: "Cotton",
      fit: "Regular",
      pattern: "Solid",
    },
    {
      userId: user._id,
      uniqueId: "pants-1",
      type: "pants",
      imageSrc: "https://example.com/pants.png",
      colour: ["black"],
      slot: "legs",
      material: "Cotton",
      fit: "Regular",
      pattern: "Solid",
    },
  ]);

  user.clothes = clothes.map((c) => c._id);
  await user.save();

  return { user, clothes };
}
