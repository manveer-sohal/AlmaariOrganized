import mongoose from "mongoose";

const ClothesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, //reference to the user who owns the clothing item, allows for efficient querying of clothes by user
  uniqueId: { type: String, required: true, unique: true },
  type: { type: String, required: true, index: true },
  imageSrc: { type: String, required: true },
  favourite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  colour: { type: [String], required: true },
  season: { type: [String], default: [] },
  waterproof: { type: Boolean, default: false },
  slot: { type: String, required: true }, //head, body, legs, feet
});

ClothesSchema.index({ userId: 1, createdAt: -1 });
ClothesSchema.index({ userId: 1, type: 1, createdAt: -1 });
ClothesSchema.index({ userId: 1, colour: 1, createdAt: -1 });

const Clothes =
  mongoose.models.Clothes || mongoose.model("Clothes", ClothesSchema);

const OutfitsSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  favourite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  colour: { type: [String], required: true },
  season: { type: [String], default: [] },
  waterproof: { type: Boolean, default: false },
  outfit_items: [{ type: mongoose.Schema.Types.ObjectId, ref: "Clothes" }],
});

const Outfits =
  mongoose.models.Outfits || mongoose.model("Outfits", OutfitsSchema);

const usersSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  clothes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Clothes" }],
  outfits: [{ type: mongoose.Schema.Types.ObjectId, ref: "Outfits" }],
  hasCompletedOnboardingForClothes: { type: Boolean, default: false },
  hasCompletedOnboardingForOutfits: { type: Boolean, default: false },
});

const User = mongoose.models.User || mongoose.model("User", usersSchema);

export { Clothes, Outfits, User };
