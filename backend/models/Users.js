import mongoose, { Schema } from "mongoose";

const ClothesSchema = new mongoose.Schema({
  uniqueId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  imageSrc: { type: String, required: true },
  favourite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  colour: { type: [String], required: true },
});

const usersSchema = new mongoose.Schema({
  auth0Id: { type: String, required: true, unique: true }, // Link to Auth0 user ID
  email: { type: String, required: true },
  Clothes: { type: [ClothesSchema], default: [] },
});

const User = mongoose.models.User || mongoose.model("User", usersSchema);

export default User;
