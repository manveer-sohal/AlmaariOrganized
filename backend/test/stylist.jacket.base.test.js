import { expect } from "chai";
import { validateLayerCombination } from "../services/aiStylist/layering/layeringRules.js";
import {
  resolveClothingSubtype,
  humanizeClothingSubtype,
  resolveBaseLayerRequirement,
} from "../services/aiStylist/layering/topSubtypeResolver.js";
import { generateLayerCombinations } from "../services/aiStylist/layering/layeringCandidateGenerator.js";
import { generateConstrainedCandidates } from "../services/aiStylist/candidateGenerator.js";
import { buildConstraints } from "../services/aiStylist/constraints.js";
import { groupBySlot } from "../utils/aiStylistScoring.js";
import { validateOutfitRecommendations } from "../services/aiStylist/validator.js";

const makeItem = ({ id, type, colour = "Blue", slot = "body", ...rest }) => ({
  _id: id,
  type,
  colour: Array.isArray(colour) ? colour : [colour],
  slot,
  material: "Cotton",
  fit: "Regular",
  pattern: "Solid",
  ...rest,
});

describe("stylist jacket/sweater base + subtypes", () => {
  const tee = makeItem({ id: "tee-1", type: "T-Shirt", colour: "White" });
  const buttonUp = makeItem({
    id: "bu-1",
    type: "Button-Up Shirt",
    colour: "Blue",
  });
  const dressShirt = makeItem({
    id: "ds-1",
    type: "Dress Shirt",
    colour: "White",
  });
  const polo = makeItem({ id: "po-1", type: "Polo", colour: "Navy" });
  const sweater = makeItem({ id: "sw-1", type: "Sweater", colour: "Grey" });
  const jacket = makeItem({ id: "jk-1", type: "Jacket", colour: "Black" });
  const denimJacket = makeItem({
    id: "dj-1",
    type: "Denim Jacket",
    colour: "Blue",
  });
  const blazer = makeItem({ id: "bl-1", type: "Blazer", colour: "Navy" });
  const jeans = makeItem({
    id: "jn-1",
    type: "Jeans",
    colour: "Navy",
    slot: "legs",
  });
  const jorts = makeItem({
    id: "jo-1",
    type: "Jorts",
    colour: "Blue",
    slot: "legs",
  });
  const shoes = makeItem({
    id: "sh-1",
    type: "Shoes",
    colour: "White",
    slot: "feet",
  });
  const genericShirt = makeItem({ id: "gs-1", type: "Shirt", colour: "Blue" });

  it("accepts T-shirt + jacket", () => {
    expect(
      validateLayerCombination({
        baseTop: tee,
        outerLayer: jacket,
      }).ok,
    ).to.equal(true);
  });

  it("accepts button-up + blazer and dress shirt + blazer", () => {
    expect(
      validateLayerCombination({
        baseTop: buttonUp,
        outerLayer: blazer,
      }).ok,
    ).to.equal(true);
    expect(
      validateLayerCombination({
        baseTop: dressShirt,
        outerLayer: blazer,
      }).ok,
    ).to.equal(true);
  });

  it("rejects jacket without a base top", () => {
    const result = validateLayerCombination({
      outerLayer: jacket,
    });
    expect(result.ok).to.equal(false);
    expect(result.reason).to.equal("missing_base_top");
  });

  it("rejects sweater without a base top", () => {
    expect(
      validateLayerCombination({
        midLayer: sweater,
      }).ok,
    ).to.equal(false);
  });

  it("adds a base under a required jacket", () => {
    const result = generateLayerCombinations({
      wardrobe: [tee, buttonUp, jacket, jeans, shoes],
      requiredItems: [jacket],
      preferences: { weather: "Mild", occasion: "Everyday", style: "Casual" },
      mode: "selected",
    });
    expect(result.combinations.length).to.be.greaterThan(0);
    for (const combo of result.combinations) {
      expect(combo.outerLayer?._id).to.equal(jacket._id);
      expect(combo.baseTop).to.exist;
    }
  });

  it("adds a base under a required sweater", () => {
    const result = generateLayerCombinations({
      wardrobe: [tee, dressShirt, sweater, jeans, shoes],
      requiredItems: [sweater],
      preferences: { weather: "Mild", occasion: "Everyday", style: "Casual" },
      mode: "selected",
    });
    expect(result.combinations.length).to.be.greaterThan(0);
    expect(result.combinations.every((c) => c.baseTop && c.midLayer)).to.equal(
      true,
    );
  });

  it("preserves required jacket in every constrained candidate", () => {
    const wardrobe = [tee, denimJacket, jeans, shoes];
    const constraints = buildConstraints({
      mode: "selected",
      requiredItemIds: [denimJacket._id],
      requiredItems: [denimJacket],
      preferences: { weather: "Mild", occasion: "Everyday", style: "Casual" },
    });
    const combos = generateConstrainedCandidates(
      groupBySlot(wardrobe),
      constraints,
    );
    expect(combos.length).to.be.greaterThan(0);
    for (const combo of combos) {
      const ids = combo.items.map((i) => i._id);
      expect(ids).to.include(denimJacket._id);
      expect(ids).to.include(tee._id);
    }
  });

  it("preserves required shirt when jacket is added", () => {
    const wardrobe = [tee, jacket, jeans, shoes];
    const constraints = buildConstraints({
      mode: "selected",
      requiredItemIds: [tee._id],
      requiredItems: [tee],
      preferences: { weather: "Cold", occasion: "Everyday", style: "Casual" },
    });
    const combos = generateConstrainedCandidates(
      groupBySlot(wardrobe),
      constraints,
    );
    expect(combos.some((c) => c.layering?.outerLayerId === jacket._id)).to.equal(
      true,
    );
    for (const combo of combos) {
      expect(combo.items.map((i) => i._id)).to.include(tee._id);
    }
  });

  it("resolves subtypes with human labels", () => {
    expect(resolveClothingSubtype(buttonUp)).to.equal("button_up");
    expect(humanizeClothingSubtype("button_up", buttonUp)).to.equal(
      "Button-Up",
    );
    expect(resolveClothingSubtype(polo)).to.equal("polo");
    expect(humanizeClothingSubtype("polo", polo)).to.equal("Polo");
    expect(resolveClothingSubtype(jorts)).to.equal("jorts");
    expect(humanizeClothingSubtype("jorts", jorts)).to.equal("Jorts");
    expect(resolveClothingSubtype(genericShirt)).to.equal("other_top");
    expect(resolveClothingSubtype(denimJacket)).to.equal("denim_jacket");
  });

  it("marks outerwear base-layer requirement as required", () => {
    expect(resolveBaseLayerRequirement(jacket)).to.equal("required");
    expect(resolveBaseLayerRequirement(sweater)).to.equal("optional");
  });

  it("validator keeps required anchors and rejects invented ids", () => {
    const allowedIds = new Set([tee._id, jacket._id, jeans._id, shoes._id]);
    const cleaned = validateOutfitRecommendations({
      recommendations: [
        {
          label: "Safe Choice",
          name: "A",
          itemIds: [tee._id, jacket._id, jeans._id, shoes._id],
          explanation: "layered",
        },
        {
          label: "Styled Choice",
          name: "B",
          itemIds: [tee._id, jeans._id, shoes._id],
          explanation: "missing jacket",
        },
        {
          label: "Alternative",
          name: "C",
          itemIds: [tee._id, jacket._id, jeans._id, shoes._id, "fake"],
          explanation: "bad",
        },
      ],
      allowedIds,
      requiredItemIds: [jacket._id],
    });
    expect(cleaned.length).to.equal(1);
    expect(cleaned[0].itemIds).to.include(jacket._id);
  });
});
