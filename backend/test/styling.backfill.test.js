import { describe, it, before, after, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import mongoose from "mongoose";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./setupTestDB.js";
import { Clothes, User } from "../models/Users.js";
import {
  buildBackfillPlan,
  classifyBackfillItem,
  clothingHasMeaningfulRichMetadata,
  DEFAULT_BACKFILL_CONCURRENCY,
  parseBackfillArgs,
  prepareBackfillForUser,
  runStylingMetadataBackfill,
  runWithConcurrency,
} from "../services/stylingBackfill.service.js";
import { applyAiStylingEnrichment } from "../services/stylingEnrichment.service.js";
import { normalizeClothingAnalysisResponse } from "../utils/normalizeClothingAnalysisResponse.js";

const seedUser = async (auth0Id = "auth0|backfill-user") =>
  User.create({
    auth0Id,
    email: `${auth0Id.replace("|", "-")}@example.com`,
  });

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

const seedLegacyClothing = async (user, overrides = {}) => {
  const doc = {
    userId: user._id,
    uniqueId: new mongoose.Types.ObjectId().toString(),
    type: "Jacket",
    imageSrc: "data:image/png;base64,legacy",
    colour: ["Black"],
    slot: "body",
    // intentionally omit material/fit/pattern/stylingMetadata
    ...overrides,
  };
  const result = await Clothes.collection.insertOne(doc);
  return Clothes.findById(result.insertedId).lean();
};

const richAnalysis = () =>
  normalizeClothingAnalysisResponse({
    type: { value: "Shirt", confidence: 0.9 },
    colour: { value: ["White"], confidence: 0.9 },
    material: { value: "Cotton", confidence: 0.9 },
    fit: { value: "Regular", confidence: 0.9 },
    pattern: { value: "Solid", confidence: 0.9 },
    styleCategory: { value: "Casual", confidence: 0.9 },
    occasionTags: { value: ["Everyday"], confidence: 0.8 },
    formalityScore: { value: 3, confidence: 0.8 },
    statementLevel: { value: 1, confidence: 0.7 },
    outfitRole: { value: "Base", confidence: 0.9 },
  });

describe("Styling metadata backfill", function () {
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

  it("parses CLI args with defaults", () => {
    const parsed = parseBackfillArgs([
      "--user=auth0|abc",
      "--mode=failed-and-missing",
      "--limit=50",
      "--dry-run",
      "--force",
      "--concurrency=2",
      "--yes",
    ]);
    expect(parsed.auth0Id).to.equal("auth0|abc");
    expect(parsed.mode).to.equal("failed-and-missing");
    expect(parsed.limit).to.equal(50);
    expect(parsed.dryRun).to.equal(true);
    expect(parsed.force).to.equal(true);
    expect(parsed.concurrency).to.equal(2);
    expect(parsed.yes).to.equal(true);
    expect(DEFAULT_BACKFILL_CONCURRENCY).to.equal(3);
  });

  it("classifies missing-only vs failed-and-missing", () => {
    const missing = { type: "Shirt" };
    const pending = {
      type: "Jeans",
      stylingMetadata: { enrichmentStatus: "pending" },
    };
    const failed = {
      type: "Coat",
      stylingMetadata: { enrichmentStatus: "failed" },
    };
    const completed = {
      type: "Hat",
      stylingMetadata: {
        enrichmentStatus: "completed",
        styleCategory: "Casual",
      },
    };

    expect(classifyBackfillItem(missing, { mode: "missing-only" }).eligible).to
      .equal(true);
    expect(classifyBackfillItem(pending, { mode: "missing-only" }).eligible).to
      .equal(true);
    expect(classifyBackfillItem(failed, { mode: "missing-only" }).eligible).to
      .equal(false);
    expect(
      classifyBackfillItem(failed, { mode: "failed-and-missing" }).eligible,
    ).to.equal(true);
    expect(classifyBackfillItem(completed, { mode: "missing-only" }).eligible)
      .to.equal(false);
    expect(
      classifyBackfillItem(completed, { mode: "missing-only", force: true })
        .eligible,
    ).to.equal(true);
    expect(clothingHasMeaningfulRichMetadata(completed)).to.equal(true);
  });

  it("builds summary counts and respects limit", () => {
    const items = [
      { _id: "1", type: "A", stylingMetadata: { enrichmentStatus: "pending" } },
      { _id: "2", type: "B", stylingMetadata: { enrichmentStatus: "failed" } },
      {
        _id: "3",
        type: "C",
        stylingMetadata: {
          enrichmentStatus: "completed",
          styleCategory: "Casual",
        },
      },
      { _id: "4", type: "D" },
    ];

    const missingOnly = buildBackfillPlan(items, {
      mode: "missing-only",
      limit: 1,
    });
    expect(missingOnly.eligibleCount).to.equal(1);
    expect(missingOnly.skippedCount).to.equal(3);

    const failedAndMissing = buildBackfillPlan(items, {
      mode: "failed-and-missing",
    });
    expect(failedAndMissing.eligibleCount).to.equal(3);
    expect(failedAndMissing.skippedCount).to.equal(1);
  });

  it("dry run does not call enrichFn or modify MongoDB", async () => {
    const user = await seedUser("auth0|dry");
    const clothing = await seedClothing(user, {
      stylingMetadata: { enrichmentStatus: "pending" },
    });
    const enrichFn = sinon.stub().resolves(clothing);

    const result = await runStylingMetadataBackfill({
      auth0Id: user.auth0Id,
      mode: "missing-only",
      dryRun: true,
      enrichFn,
    });

    expect(enrichFn.called).to.equal(false);
    expect(result.dryRun).to.equal(true);
    expect(result.plan.eligibleCount).to.equal(1);
    expect(result.totals.completed).to.equal(0);

    const reloaded = await Clothes.findById(clothing._id).lean();
    expect(reloaded.stylingMetadata.enrichmentStatus).to.equal("pending");
    expect(reloaded.stylingMetadata.styleCategory == null).to.equal(true);
  });

  it("missing-only processes pending and skips failed + completed", async () => {
    const user = await seedUser("auth0|missing");
    const pending = await seedClothing(user, {
      type: "Shirt",
      stylingMetadata: { enrichmentStatus: "pending" },
    });
    await seedClothing(user, {
      type: "Coat",
      stylingMetadata: { enrichmentStatus: "failed" },
    });
    await seedClothing(user, {
      type: "Hat",
      stylingMetadata: {
        enrichmentStatus: "completed",
        styleCategory: "Casual",
        occasionTags: ["Everyday"],
      },
    });

    const enrichFn = sinon.stub().callsFake(async (id) => {
      await Clothes.findByIdAndUpdate(
        id,
        {
          $set: {
            "stylingMetadata.enrichmentStatus": "completed",
            "stylingMetadata.styleCategory": "Casual",
          },
        },
        { runValidators: false },
      );
      return Clothes.findById(id);
    });

    const result = await runStylingMetadataBackfill({
      auth0Id: user.auth0Id,
      mode: "missing-only",
      enrichFn,
      concurrency: 2,
    });

    expect(result.plan.eligibleCount).to.equal(1);
    expect(result.plan.eligible[0].item._id.toString()).to.equal(
      pending._id.toString(),
    );
    expect(enrichFn.callCount).to.equal(1);
    expect(result.totals.completed).to.equal(1);
    expect(result.totals.failed).to.equal(0);
  });

  it("force mode re-enriches completed items but preserves user-sourced fields", async () => {
    const user = await seedUser("auth0|force");
    const clothing = await seedClothing(user, {
      stylingMetadata: {
        enrichmentStatus: "completed",
        styleCategory: "Formal",
        styleCategorySource: "user",
        occasionTags: ["Work"],
        occasionTagsSource: "user",
        formalityScore: 9,
        statementLevel: 1,
        outfitRole: "Base",
      },
    });

    const plan = buildBackfillPlan([clothing.toObject()], {
      mode: "missing-only",
      force: true,
    });
    expect(plan.eligibleCount).to.equal(1);

    const applied = await applyAiStylingEnrichment({
      clothingId: clothing._id,
      analysis: richAnalysis(),
      force: true,
    });

    expect(applied.clothing.stylingMetadata.styleCategory).to.equal("Formal");
    expect(applied.clothing.stylingMetadata.styleCategorySource).to.equal(
      "user",
    );
    expect(applied.clothing.stylingMetadata.occasionTags).to.deep.equal([
      "Work",
    ]);
    expect(applied.clothing.stylingMetadata.occasionTagsSource).to.equal(
      "user",
    );
    // AI still fills non-user-owned rich fields
    expect(applied.clothing.stylingMetadata.outfitRole).to.equal("Base");
  });

  it("enriches legacy clothing missing material/fit/pattern/stylingMetadata", async () => {
    const user = await seedUser("auth0|legacy");
    const legacy = await seedLegacyClothing(user);
    expect(legacy.material).to.equal(undefined);
    expect(legacy.stylingMetadata).to.equal(undefined);

    const applied = await applyAiStylingEnrichment({
      clothingId: legacy._id,
      analysis: richAnalysis(),
    });

    expect(applied.skipped).to.equal(false);
    expect(applied.clothing.stylingMetadata.enrichmentStatus).to.equal(
      "completed",
    );
    expect(applied.clothing.stylingMetadata.styleCategory).to.equal("Casual");

    // core legacy fields remain untouched / still absent
    const reloaded = await Clothes.findById(legacy._id).lean();
    expect(reloaded.material).to.equal(undefined);
    expect(reloaded.fit).to.equal(undefined);
    expect(reloaded.pattern).to.equal(undefined);
  });

  it("only includes clothing owned by the supplied user", async () => {
    const owner = await seedUser("auth0|owner");
    const other = await seedUser("auth0|other");
    await seedClothing(owner, {
      type: "OwnerShirt",
      stylingMetadata: { enrichmentStatus: "pending" },
    });
    await seedClothing(other, {
      type: "OtherShirt",
      stylingMetadata: { enrichmentStatus: "pending" },
    });

    const prepared = await prepareBackfillForUser({
      auth0Id: owner.auth0Id,
      mode: "missing-only",
    });

    expect(prepared.plan.total).to.equal(1);
    expect(prepared.plan.eligible[0].item.type).to.equal("OwnerShirt");
  });

  it("limits concurrency and continues after individual failures", async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 6 }, (_, i) => i);

    const safeResults = await runWithConcurrency(items, 3, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 25));
      active -= 1;
      if (value === 2) return { ok: false };
      return { ok: true, value };
    });

    expect(maxActive).to.be.at.most(3);
    expect(safeResults).to.have.length(6);
    expect(safeResults.filter((row) => row.ok).length).to.equal(5);

    const user = await seedUser("auth0|concurrency");
    const pendingItems = [];
    for (let i = 0; i < 5; i += 1) {
      pendingItems.push(
        await seedClothing(user, {
          type: `Item${i}`,
          stylingMetadata: { enrichmentStatus: "pending" },
        }),
      );
    }
    const failId = String(pendingItems[1]._id);

    active = 0;
    maxActive = 0;
    const enrichFn = sinon.stub().callsFake(async (id) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 30));
      active -= 1;
      if (String(id) === failId) {
        throw new Error("simulated failure");
      }
      await Clothes.findByIdAndUpdate(
        id,
        {
          $set: {
            "stylingMetadata.enrichmentStatus": "completed",
            "stylingMetadata.styleCategory": "Casual",
          },
        },
        { runValidators: false },
      );
      return Clothes.findById(id);
    });

    const backfill = await runStylingMetadataBackfill({
      auth0Id: user.auth0Id,
      mode: "missing-only",
      enrichFn,
      concurrency: 3,
    });

    expect(maxActive).to.be.at.most(3);
    expect(backfill.totals.completed).to.equal(4);
    expect(backfill.totals.failed).to.equal(1);
  });
});
