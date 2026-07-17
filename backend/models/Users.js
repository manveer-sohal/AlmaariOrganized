import mongoose from "mongoose";

const ConfidenceSchema = new mongoose.Schema(
  {
    type: { type: Number, min: 0, max: 1, default: null },
    colour: { type: Number, min: 0, max: 1, default: null },
    material: { type: Number, min: 0, max: 1, default: null },
    fit: { type: Number, min: 0, max: 1, default: null },
    pattern: { type: Number, min: 0, max: 1, default: null },
    styleCategory: { type: Number, min: 0, max: 1, default: null },
    occasionTags: { type: Number, min: 0, max: 1, default: null },
    formalityScore: { type: Number, min: 0, max: 1, default: null },
    statementLevel: { type: Number, min: 0, max: 1, default: null },
    outfitRole: { type: Number, min: 0, max: 1, default: null },
    subtype: { type: Number, min: 0, max: 1, default: null },
  },
  { _id: false },
);

const StylingMetadataSchema = new mongoose.Schema(
  {
    styleCategory: {
      type: String,
      enum: ["Casual", "Smart Casual", "Formal", "Athletic", null],
      default: null,
    },
    occasionTags: {
      type: [String],
      enum: [
        "Everyday",
        "Work",
        "Going Out",
        "Event",
        "Formal Event",
        "Travel",
        "Active",
      ],
      default: [],
    },
    formalityScore: { type: Number, min: 1, max: 10, default: null },
    statementLevel: { type: Number, min: 1, max: 5, default: null },
    outfitRole: {
      type: String,
      enum: ["Base", "Layer", "Accent", "Statement", null],
      default: null,
    },
    /** Optional normalized garment subtype (e.g. button_up, polo, jorts). */
    subtype: { type: String, default: null },
    confidence: { type: ConfidenceSchema, default: () => ({}) },
    styleCategorySource: {
      type: String,
      enum: ["ai", "user", null],
      default: null,
    },
    occasionTagsSource: {
      type: String,
      enum: ["ai", "user", null],
      default: null,
    },
    enrichmentStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    enrichmentError: { type: String, default: null },
    enrichedAt: { type: Date, default: null },
    processingStartedAt: { type: Date, default: null },
    lastRetryAt: { type: Date, default: null },
    enrichmentAttemptCount: { type: Number, default: 0, min: 0 },
    userReviewedAt: { type: Date, default: null },
  },
  { _id: false },
);

const ClothesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, //reference to the user who owns the clothing item, allows for efficient querying of clothes by user
  uniqueId: { type: String, required: true, unique: true },
  type: { type: String, required: true, index: true },
  imageSrc: { type: String, required: true },
  favourite: { type: Boolean, default: false },
  /** Demo wardrobe items seeded for trying AI outfits */
  isSample: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
  colour: { type: [String], required: true },
  season: { type: [String], default: [] },
  waterproof: { type: Boolean, default: false },
  slot: { type: String, required: true }, //head, body, legs, feet
  material: { type: String, required: true }, //Cotton, Polyester, Wool, Silk, etc.
  fit: { type: String, required: true }, //Slim, Regular, Relaxed, Oversized, Baggy, etc.
  pattern: { type: String, required: true }, //Solid, Striped, Checked, Polka Dot, etc.
  stylingMetadata: {
    type: StylingMetadataSchema,
    default: () => ({
      styleCategory: null,
      occasionTags: [],
      formalityScore: null,
      statementLevel: null,
      outfitRole: null,
      subtype: null,
      confidence: {},
      styleCategorySource: null,
      occasionTagsSource: null,
      enrichmentStatus: "pending",
      enrichmentError: null,
      enrichedAt: null,
      processingStartedAt: null,
      lastRetryAt: null,
      enrichmentAttemptCount: 0,
      userReviewedAt: null,
    }),
  },
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
  onboardingTourSeenAt: { type: Date, default: null },
  role: { type: String, default: "user" },
  creditBalance: { type: Number, default: 5, min: 0 },
});

const User = mongoose.models.User || mongoose.model("User", usersSchema);

export { Clothes, Outfits, User };
