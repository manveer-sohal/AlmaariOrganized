import mongoose, { Schema } from "mongoose";

const ClothesSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  type: { type: String, required: true, index: true },
  imageSrc: { type: String, required: true },
  favourite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  colour: { type: [String], required: true },
  seaon: { type: [String], default: [] },
  waterproof: { type: Boolean, default: false },
});

const OutfitsSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  favourite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  colour: { type: [String], required: true },
  seaon: { type: [String], default: [] },
  waterproof: { type: Boolean, default: false },
  outfit_items: { type: [ClothesSchema], default: [] },
});

const usersSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true, index: true }, // Link to Auth0 user ID
  email: { type: String, required: true },
  Clothes: { type: [ClothesSchema], default: [] },
  outfits: { type: [OutfitsSchema], default: [] },
});

const User = mongoose.models.User || mongoose.model("User", usersSchema);

export default User;
