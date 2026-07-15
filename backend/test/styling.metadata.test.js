import { describe, it, before, after, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./setupTestDB.js";
import { Clothes, User } from "../models/Users.js";
import {
  hasRichStylingFields,
  normalizeClothingAnalysisResponse,
} from "../utils/normalizeClothingAnalysisResponse.js";
import { serializeWardrobeItemForStylist } from "../utils/serializeWardrobeItem.js";
import {
  applyAiStylingEnrichment,
  claimEnrichmentJob,
  enrichClothingStyling,
  ENRICHMENT_STALE_MS,
  isEnrichmentStale,
  retryStyleEnrichmentForUser,
  scheduleStylingEnrichment,
  updateUserStyleDetails,
} from "../services/stylingEnrichment.service.js";
import { statementBalance, scoreOutfit } from "../utils/aiStylistScoring.js";
import { validateRecommendations } from "../utils/aiStylistValidation.js";

const seedClothing = async (user, overrides = {}) =>
  Clothes.create({
    userId: user._id,
    uniqueId: new mongoose.Types.ObjectId().toString(),
    type: "Shirt",
    imageSrc: "data:image/png;base64,abc",
    colour: ["White"],
    slot: "body",
    material: "Cotton",
    fit: "Regular",
    pattern: "Solid",
    ...overrides,
  });

const richAnalysis = () =>
  normalizeClothingAnalysisResponse({
    type: { value: "Shirt", confidence: 0.9 },
    colour: { value: ["White"], confidence: 0.9 },
    material: { value: "Cotton", confidence: 0.9 },
    fit: { value: "Regular", confidence: 0.9 },
    pattern: { value: "Solid", confidence: 0.9 },
    styleCategory: { value: "Smart Casual", confidence: 0.88 },
    occasionTags: { value: ["Work"], confidence: 0.8 },
    formalityScore: { value: 7, confidence: 0.85 },
    statementLevel: { value: 1, confidence: 0.7 },
    outfitRole: { value: "Base", confidence: 0.9 },
  });

const legacyAnalysis = () =>
  normalizeClothingAnalysisResponse({
    type: { value: "Tie", confidence: 0.98 },
    colour: { value: ["Red"], confidence: 0.91 },
    material: { value: "Silk", confidence: 0.72 },
    fit: { value: null, confidence: 0.25 },
    pattern: { value: "Solid", confidence: 0.94 },
  });

describe("Styling metadata", function () {
  this.timeout(15000);

  before(async () => {
    await connectTestDB();
  });

  after(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("accepts existing clothing documents without stylingMetadata", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-1",
      email: "style1@example.com",
    });

    const clothing = await Clothes.collection.insertOne({
      userId: user._id,
      uniqueId: new mongoose.Types.ObjectId().toString(),
      type: "Shirt",
      imageSrc: "data:image/png;base64,abc",
      colour: ["Blue"],
      season: [],
      waterproof: false,
      favourite: false,
      createdAt: new Date(),
      slot: "body",
      material: "Cotton",
      fit: "Regular",
      pattern: "Solid",
    });

    const loaded = await Clothes.findById(clothing.insertedId);
    expect(loaded).to.exist;
    expect(loaded.type).to.equal("Shirt");
  });

  it("defaults enrichmentStatus to pending on create", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-2",
      email: "style2@example.com",
    });
    const clothing = await seedClothing(user);
    expect(clothing.stylingMetadata.enrichmentStatus).to.equal("pending");
  });

  it("does not mark rich enrichment completed for legacy FastAPI output", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-legacy",
      email: "legacy@example.com",
    });
    const clothing = await seedClothing(user);
    const analysis = legacyAnalysis();
    expect(hasRichStylingFields(analysis.styling)).to.equal(false);

    const result = await applyAiStylingEnrichment({
      clothingId: clothing._id,
      analysis,
    });

    expect(result.rich).to.equal(false);
    expect(result.clothing.stylingMetadata.enrichmentStatus).to.equal("pending");
    expect(result.clothing.stylingMetadata.enrichedAt).to.equal(null);
  });

  it("applies AI enrichment to hidden fields when rich metadata exists", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-3",
      email: "style3@example.com",
    });
    const clothing = await seedClothing(user);
    const result = await applyAiStylingEnrichment({
      clothingId: clothing._id,
      analysis: richAnalysis(),
    });

    expect(result.clothing.stylingMetadata.styleCategory).to.equal(
      "Smart Casual",
    );
    expect(result.clothing.stylingMetadata.styleCategorySource).to.equal("ai");
    expect(result.clothing.stylingMetadata.formalityScore).to.equal(7);
    expect(result.clothing.stylingMetadata.enrichmentStatus).to.equal(
      "completed",
    );
  });

  it("preserves user-reviewed styleCategory while enriching unreviewed occasionTags", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-4",
      email: "style4@example.com",
    });
    const clothing = await seedClothing(user, {
      stylingMetadata: {
        styleCategory: "Casual",
        styleCategorySource: "user",
        occasionTags: [],
        occasionTagsSource: null,
        userReviewedAt: new Date(),
        enrichmentStatus: "pending",
      },
    });

    const result = await applyAiStylingEnrichment({
      clothingId: clothing._id,
      analysis: richAnalysis(),
    });

    expect(result.clothing.stylingMetadata.styleCategory).to.equal("Casual");
    expect(result.clothing.stylingMetadata.styleCategorySource).to.equal(
      "user",
    );
    expect(result.clothing.stylingMetadata.occasionTags).to.deep.equal([
      "Work",
    ]);
    expect(result.clothing.stylingMetadata.occasionTagsSource).to.equal("ai");
    // Casual band max is 4; AI formality 7 is clamped down.
    expect(result.clothing.stylingMetadata.formalityScore).to.equal(4);
  });

  it("lets a user edit style details for owned clothing only", async () => {
    const owner = await User.create({
      auth0Id: "auth0|style-5",
      email: "style5@example.com",
    });
    const other = await User.create({
      auth0Id: "auth0|style-6",
      email: "style6@example.com",
    });
    const clothing = await seedClothing(owner);

    const updated = await updateUserStyleDetails({
      clothingId: clothing._id,
      userId: owner._id,
      styleCategory: "Formal",
      occasionTags: ["Work"],
    });

    expect(updated.stylingMetadata.styleCategory).to.equal("Formal");
    expect(updated.stylingMetadata.styleCategorySource).to.equal("user");
    expect(updated.stylingMetadata.formalityScore).to.be.at.least(7);
    expect(updated.stylingMetadata.userReviewedAt).to.be.an.instanceOf(Date);

    let threw = false;
    try {
      await updateUserStyleDetails({
        clothingId: clothing._id,
        userId: other._id,
        styleCategory: "Casual",
      });
    } catch (error) {
      threw = true;
      expect(error.status).to.equal(404);
    }
    expect(threw).to.equal(true);
  });

  it("two concurrent enrichment claims allow only one worker", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-claim",
      email: "claim@example.com",
    });
    const clothing = await seedClothing(user);

    const first = await claimEnrichmentJob(clothing._id);
    const second = await claimEnrichmentJob(clothing._id);

    expect(first).to.exist;
    expect(first.stylingMetadata.enrichmentStatus).to.equal("processing");
    expect(first.stylingMetadata.processingStartedAt).to.be.an.instanceOf(Date);
    expect(second).to.equal(null);
  });

  it("allows retry for pending enrichment status", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-pending-retry",
      email: "pending-retry@example.com",
    });
    const clothing = await seedClothing(user, {
      stylingMetadata: {
        enrichmentStatus: "pending",
        enrichmentAttemptCount: 0,
      },
    });

    const result = await retryStyleEnrichmentForUser({
      auth0Id: user.auth0Id,
      clothingId: clothing._id,
    });
    expect(result.message).to.include("retry");
  });

  it("detects stale processing and allows retry", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-stale",
      email: "stale@example.com",
    });
    const clothing = await seedClothing(user, {
      stylingMetadata: {
        enrichmentStatus: "processing",
        processingStartedAt: new Date(Date.now() - ENRICHMENT_STALE_MS - 1000),
        enrichmentAttemptCount: 1,
      },
    });

    expect(isEnrichmentStale(clothing.stylingMetadata)).to.equal(true);

    const result = await retryStyleEnrichmentForUser({
      auth0Id: user.auth0Id,
      clothingId: clothing._id,
    });
    expect(result.message).to.include("retry");

    const claimed = await claimEnrichmentJob(clothing._id);
    expect(claimed).to.exist;
  });

  it("rejects retry while non-stale processing is active", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-fresh",
      email: "fresh@example.com",
    });
    const clothing = await seedClothing(user, {
      stylingMetadata: {
        enrichmentStatus: "processing",
        processingStartedAt: new Date(),
        enrichmentAttemptCount: 1,
      },
    });

    expect(isEnrichmentStale(clothing.stylingMetadata)).to.equal(false);

    let threw = false;
    try {
      await retryStyleEnrichmentForUser({
        auth0Id: user.auth0Id,
        clothingId: clothing._id,
      });
    } catch (error) {
      threw = true;
      expect(error.status).to.equal(409);
      expect(error.code).to.equal("IN_PROGRESS");
    }
    expect(threw).to.equal(true);
  });

  it("marks failed enrichment without deleting the clothing item", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-7",
      email: "style7@example.com",
    });
    const clothing = await seedClothing(user, {
      imageSrc: "data:image/png;base64,",
    });

    await enrichClothingStyling(clothing._id);

    const reloaded = await Clothes.findById(clothing._id);
    expect(reloaded).to.exist;
    expect(reloaded.stylingMetadata.enrichmentStatus).to.equal("failed");
    expect(reloaded.stylingMetadata.enrichmentError).to.equal(
      "Style analysis unavailable",
    );
  });

  it("handles async rejection from scheduleStylingEnrichment and sets failed", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-async",
      email: "async@example.com",
    });
    const clothing = await seedClothing(user, {
      imageSrc: "data:image/png;base64,",
    });

    await new Promise((resolve) => {
      scheduleStylingEnrichment(clothing._id);
      setTimeout(resolve, 200);
    });

    const reloaded = await Clothes.findById(clothing._id);
    expect(reloaded.stylingMetadata.enrichmentStatus).to.equal("failed");
  });

  it("exits safely when clothing is missing during apply or enrichment", async () => {
    const missingId = new mongoose.Types.ObjectId();
    const applied = await applyAiStylingEnrichment({
      clothingId: missingId,
      analysis: richAnalysis(),
    });
    expect(applied.reason).to.equal("deleted");
    expect(applied.clothing).to.equal(null);

    const user = await User.create({
      auth0Id: "auth0|style-del",
      email: "del@example.com",
    });
    const clothing = await seedClothing(user);
    const id = clothing._id;
    await claimEnrichmentJob(id);
    await Clothes.deleteOne({ _id: id });

    const result = await enrichClothingStyling(id);
    expect(result).to.equal(null);
  });

  it("skips reprocessing when already completed (idempotent)", async () => {
    const user = await User.create({
      auth0Id: "auth0|style-8",
      email: "style8@example.com",
    });
    const clothing = await seedClothing(user, {
      stylingMetadata: {
        enrichmentStatus: "completed",
        styleCategory: "Casual",
        occasionTags: ["Everyday"],
        formalityScore: 4,
        enrichedAt: new Date(),
      },
    });

    const result = await enrichClothingStyling(clothing._id);
    expect(result.stylingMetadata.enrichmentStatus).to.equal("completed");
    expect(result.stylingMetadata.styleCategory).to.equal("Casual");
  });

  it("serializes rich metadata for stylist and handles missing metadata", () => {
    const rich = serializeWardrobeItemForStylist({
      _id: "abc",
      slot: "body",
      type: "Oxford Shirt",
      colour: ["White"],
      material: "Cotton",
      fit: "Regular",
      pattern: "Solid",
      season: ["Spring"],
      stylingMetadata: {
        styleCategory: "Smart Casual",
        styleCategorySource: "user",
        occasionTags: ["Work"],
        occasionTagsSource: "user",
        formalityScore: 9,
        statementLevel: 1,
        outfitRole: "Base",
      },
    });

    expect(rich.styleCategory).to.equal("Smart Casual");
    expect(rich.styleCategorySource).to.equal("user");
    // User Formal/Smart Casual clamp: Smart Casual band max 7
    expect(rich.formalityScore).to.equal(7);

    const legacy = serializeWardrobeItemForStylist({
      _id: "def",
      slot: "legs",
      type: "Jeans",
      colour: ["Blue"],
      material: "Denim",
      fit: "Relaxed",
      pattern: "Solid",
    });

    expect(legacy.styleCategory).to.equal(undefined);
    expect(legacy.id).to.equal("def");
  });

  it("validates stylist recommendation IDs and rejects duplicates / outsiders", () => {
    const allowedIds = new Set(["1", "2", "3"]);
    const cleaned = validateRecommendations({
      recommendations: [
        {
          label: "Safe Choice",
          itemIds: ["1", "2"],
          explanation: "ok",
        },
        {
          label: "Styled Choice",
          itemIds: ["1", "1"],
          explanation: "dup",
        },
        {
          label: "Alternative",
          itemIds: ["1", "99"],
          explanation: "outside",
        },
        {
          label: "Alternative",
          itemIds: ["2", "3"],
          explanation: "ok2",
        },
      ],
      allowedIds,
      anchorItemId: "1",
    });

    expect(cleaned).to.have.length(1);
    expect(cleaned[0].itemIds).to.deep.equal(["1", "2"]);
  });

  it("penalizes multiple high-statement items", () => {
    const balanced = statementBalance(
      [
        { stylingMetadata: { statementLevel: 5 } },
        { stylingMetadata: { statementLevel: 1 } },
      ],
      { style: "Casual", occasion: "Everyday" },
    );
    const overloaded = statementBalance(
      [
        { stylingMetadata: { statementLevel: 5 } },
        { stylingMetadata: { statementLevel: 5 } },
      ],
      { style: "Casual", occasion: "Everyday" },
    );

    expect(balanced).to.be.greaterThan(overloaded);

    const formalMismatch = scoreOutfit(
      [
        {
          type: "Blazer",
          colour: ["Navy"],
          stylingMetadata: { formalityScore: 9 },
        },
        {
          type: "Hoodie",
          colour: ["Red"],
          stylingMetadata: { formalityScore: 2 },
        },
      ],
      { occasion: "Work", weather: "Mild", style: "Smart casual" },
      { isEmpty: true },
    );

    const formalMatch = scoreOutfit(
      [
        {
          type: "Blazer",
          colour: ["Navy"],
          stylingMetadata: { formalityScore: 8 },
        },
        {
          type: "Trousers",
          colour: ["Grey"],
          stylingMetadata: { formalityScore: 7 },
        },
      ],
      { occasion: "Work", weather: "Mild", style: "Smart casual" },
      { isEmpty: true },
    );

    expect(formalMatch).to.be.greaterThan(formalMismatch);
  });
});
