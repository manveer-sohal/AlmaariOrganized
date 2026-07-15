import { expect } from "chai";
import {
  resolveStylistMode,
  validateModeRequirements,
} from "../services/aiStylist/modeResolver.js";
import { buildConstraints } from "../services/aiStylist/constraints.js";
import { generateConstrainedCandidates } from "../services/aiStylist/candidateGenerator.js";
import { noveltyScore } from "../services/aiStylist/scoring.js";
import { validateOutfitRecommendations } from "../services/aiStylist/validator.js";
import {
  groupBySlot,
  outfitSignature,
  pickDiverseOutfits,
  scoreOutfitComponents,
} from "../utils/aiStylistScoring.js";
import { validateRecommendationRequest } from "../utils/aiStylistValidation.js";

const makeItem = ({ id, type, colour, slot = "body" }) => ({
  _id: id,
  type,
  colour: Array.isArray(colour) ? colour : [colour],
  slot,
  material: "Cotton",
  fit: "Regular",
  pattern: "Solid",
});

describe("stylist modes pipeline", () => {
  const shoes = makeItem({
    id: "shoes-1",
    type: "Shoes",
    colour: "Black",
    slot: "feet",
  });
  const top = makeItem({
    id: "top-1",
    type: "Shirt",
    colour: "Blue",
    slot: "body",
  });
  const bottom = makeItem({
    id: "bottom-1",
    type: "Jeans",
    colour: "Navy",
    slot: "legs",
  });
  const dress = makeItem({
    id: "dress-1",
    type: "Dress",
    colour: "Red",
    slot: "body",
  });
  const hat = makeItem({
    id: "hat-1",
    type: "Cap",
    colour: "Black",
    slot: "head",
  });
  const shoes2 = makeItem({
    id: "shoes-2",
    type: "Sneakers",
    colour: "White",
    slot: "feet",
  });
  const top2 = makeItem({
    id: "top-2",
    type: "T-shirt",
    colour: "White",
    slot: "body",
  });
  const bottom2 = makeItem({
    id: "bottom-2",
    type: "Trousers",
    colour: "Grey",
    slot: "legs",
  });

  const wardrobe = [top, top2, bottom, bottom2, shoes, shoes2, dress, hat];

  it("maps legacy anchorItemId to selected mode with required items", () => {
    const resolved = resolveStylistMode({
      anchorItemId: "top-1",
      requiredItemIds: [],
      previewItemIds: [],
    });
    expect(resolved.mode).to.equal("selected");
    expect(resolved.requiredItemIds).to.deep.equal(["top-1"]);
  });

  it("rejects empty selection for selected mode", () => {
    const resolved = resolveStylistMode({
      mode: "selected",
      requiredItemIds: [],
      previewItemIds: [],
    });
    const err = validateModeRequirements(resolved);
    expect(err?.code).to.equal("EMPTY_SELECTION");
  });

  it("rejects empty preview for complete and improve modes", () => {
    expect(
      validateModeRequirements(
        resolveStylistMode({
          mode: "complete",
          requiredItemIds: [],
          previewItemIds: [],
        }),
      )?.code,
    ).to.equal("EMPTY_PREVIEW");
    expect(
      validateModeRequirements(
        resolveStylistMode({
          mode: "improve",
          requiredItemIds: [],
          previewItemIds: [],
        }),
      )?.code,
    ).to.equal("EMPTY_PREVIEW");
  });

  it("generates random outfits with no required items", () => {
    const bySlot = groupBySlot(wardrobe);
    const constraints = buildConstraints({
      mode: "random",
      requiredItemIds: [],
      requiredItems: [],
      preferences: {},
    });
    const combos = generateConstrainedCandidates(bySlot, constraints);
    expect(combos.length).to.be.greaterThan(0);
    expect(combos.length).to.be.at.most(100);
  });

  it("keeps multiple required items in every candidate", () => {
    const requiredItems = [top, bottom];
    const constraints = buildConstraints({
      mode: "selected",
      requiredItemIds: ["top-1", "bottom-1"],
      requiredItems,
      preferences: {},
    });
    const combos = generateConstrainedCandidates(
      groupBySlot(wardrobe),
      constraints,
    );
    expect(combos.length).to.be.greaterThan(0);
    for (const combo of combos) {
      const items = Array.isArray(combo) ? combo : combo.items;
      const ids = items.map((i) => i._id);
      expect(ids).to.include("top-1");
      expect(ids).to.include("bottom-1");
      expect(ids).to.include.oneOf(["shoes-1", "shoes-2"]);
    }
  });

  it("fills shoes (and optional accessory) for a dress requirement", () => {
    const constraints = buildConstraints({
      mode: "selected",
      requiredItemIds: ["dress-1"],
      requiredItems: [dress],
      preferences: {},
    });
    expect([...constraints.missingSlots]).to.include("feet");
    const combos = generateConstrainedCandidates(
      groupBySlot(wardrobe),
      constraints,
    );
    expect(combos.length).to.be.greaterThan(0);
    for (const combo of combos) {
      const items = Array.isArray(combo) ? combo : combo.items;
      const ids = items.map((i) => i._id);
      expect(ids).to.include("dress-1");
      expect(items.some((i) => i.slot === "feet")).to.equal(true);
    }
  });

  it("complete mode preserves all preview items", () => {
    const requiredItems = [top, bottom, shoes];
    const constraints = buildConstraints({
      mode: "complete",
      requiredItemIds: ["top-1", "bottom-1", "shoes-1"],
      requiredItems,
      preferences: {},
    });
    const combos = generateConstrainedCandidates(
      groupBySlot(wardrobe),
      constraints,
    );
    expect(combos.length).to.be.greaterThan(0);
    for (const combo of combos) {
      const items = Array.isArray(combo) ? combo : combo.items;
      const ids = items.map((i) => i._id);
      expect(ids).to.include.members(["top-1", "bottom-1", "shoes-1"]);
    }
  });

  it("improve mode does not replace preview items", () => {
    const requiredItems = [top, bottom, shoes];
    const constraints = buildConstraints({
      mode: "improve",
      requiredItemIds: ["top-1", "bottom-1", "shoes-1"],
      requiredItems,
      preferences: {},
    });
    const combos = generateConstrainedCandidates(
      groupBySlot(wardrobe),
      constraints,
    );
    expect(combos.length).to.be.greaterThan(0);
    for (const combo of combos) {
      const items = Array.isArray(combo) ? combo : combo.items;
      const ids = items.map((i) => i._id);
      expect(ids).to.include.members(["top-1", "bottom-1", "shoes-1"]);
      // Should only add accessory variants, not swap core pieces
      expect(ids.filter((id) => id === "top-2").length).to.equal(0);
      expect(ids.filter((id) => id === "shoes-2").length).to.equal(0);
    }
  });

  it("returns at most 3 validated outfits and rejects invented IDs", () => {
    const allowedIds = new Set(wardrobe.map((i) => i._id));
    const cleaned = validateOutfitRecommendations({
      recommendations: [
        {
          label: "Safe Choice",
          name: "A",
          itemIds: ["top-1", "bottom-1", "shoes-1"],
          explanation: "ok",
        },
        {
          label: "Styled Choice",
          name: "B",
          itemIds: ["top-2", "bottom-2", "shoes-2"],
          explanation: "ok",
        },
        {
          label: "Alternative",
          name: "Fake",
          itemIds: ["top-1", "bottom-1", "not-real"],
          explanation: "bad",
        },
        {
          label: "Alternative",
          name: "C",
          itemIds: ["dress-1", "shoes-1", "hat-1"],
          explanation: "ok",
        },
      ],
      allowedIds,
      requiredItemIds: [],
      generationId: "gen-1",
      mode: "random",
    });
    expect(cleaned).to.have.length(3);
    expect(
      cleaned.every((rec) =>
        rec.itemIds.every((id) => allowedIds.has(id)),
      ),
    ).to.equal(true);
  });

  it("rejects candidates that drop required items", () => {
    const allowedIds = new Set(wardrobe.map((i) => i._id));
    const cleaned = validateOutfitRecommendations({
      recommendations: [
        {
          label: "Safe Choice",
          name: "Dropped",
          itemIds: ["bottom-1", "shoes-1"],
          explanation: "missing top",
        },
      ],
      allowedIds,
      requiredItemIds: ["top-1", "bottom-1"],
      generationId: "gen-2",
      mode: "selected",
    });
    expect(cleaned).to.have.length(0);
  });

  it("scores exact duplicate outfits with novelty 0", () => {
    const items = [top, bottom, shoes];
    const signature = outfitSignature(items);
    expect(noveltyScore(items, [signature])).to.equal(0);
    expect(noveltyScore(items, [])).to.equal(1);
  });

  it("does not exclude required anchor when many tops exist", () => {
    const manyTops = Array.from({ length: 20 }, (_, index) =>
      makeItem({
        id: `bulk-top-${index}`,
        type: "Shirt",
        colour: "White",
        slot: "body",
      }),
    );
    const anchor = manyTops[19];
    const constraints = buildConstraints({
      mode: "selected",
      requiredItemIds: [anchor._id],
      requiredItems: [anchor],
      preferences: {},
    });
    const combos = generateConstrainedCandidates(
      groupBySlot([...manyTops, bottom, shoes]),
      constraints,
    );
    expect(combos.length).to.be.greaterThan(0);
    expect(
      combos.every((combo) => {
        const items = Array.isArray(combo) ? combo : combo.items;
        return items.some((i) => i._id === anchor._id);
      }),
    ).to.equal(true);
  });

  it("parses extended recommendation request fields", () => {
    const parsed = validateRecommendationRequest({
      mode: "complete",
      previewItemIds: ["a", "b"],
      requiredItemIds: ["x"],
      refinementPrompt: "more casual",
      priorOutfitSignatures: ["a|b"],
      occasion: "Dinner",
    });
    expect(parsed.errors).to.have.length(0);
    expect(parsed.mode).to.equal("complete");
    expect(parsed.previewItemIds).to.deep.equal(["a", "b"]);
    expect(parsed.refinementPrompt).to.equal("more casual");
  });

  it("exposes component scores including novelty", () => {
    const { total, components } = scoreOutfitComponents(
      [top, bottom, shoes],
      { occasion: "Everyday", weather: "Mild", style: "Casual" },
      { isEmpty: true },
      { priorSignatures: [] },
    );
    expect(total).to.be.a("number");
    expect(components.novelty).to.equal(1);
    expect(components.colourHarmony).to.be.a("number");
  });

  it("pickDiverseOutfits still returns up to 3", () => {
    const bySlot = groupBySlot(wardrobe);
    const constraints = buildConstraints({
      mode: "random",
      requiredItemIds: [],
      requiredItems: [],
      preferences: {},
    });
    const combos = generateConstrainedCandidates(bySlot, constraints);
    const scored = combos.map((combo) => {
      const items = Array.isArray(combo) ? combo : combo.items;
      return {
        items,
        score: 0.5,
        signature: outfitSignature(items),
        layering: combo.layering,
      };
    });
    const picked = pickDiverseOutfits(scored, 3);
    expect(picked.length).to.be.at.most(3);
    expect(picked.length).to.be.greaterThan(0);
  });
});
