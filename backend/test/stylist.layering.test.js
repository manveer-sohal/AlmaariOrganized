import { expect } from "chai";
import {
  validateLayerCombination,
  scoreLayerCombination,
} from "../services/aiStylist/layering/layeringRules.js";
import {
  resolveLayerRoles,
  getLayeringMetadata,
} from "../services/aiStylist/layering/layerRoles.js";
import { resolveRequiredLayerInterpretations } from "../services/aiStylist/layering/layeringResolver.js";
import { generateLayerCombinations } from "../services/aiStylist/layering/layeringCandidateGenerator.js";
import { generateConstrainedCandidates } from "../services/aiStylist/candidateGenerator.js";
import { buildConstraints } from "../services/aiStylist/constraints.js";
import { validateOutfitRecommendations } from "../services/aiStylist/validator.js";
import { groupBySlot } from "../utils/aiStylistScoring.js";

const makeItem = ({ id, type, colour = "Blue", slot = "body" }) => ({
  _id: id,
  type,
  colour: Array.isArray(colour) ? colour : [colour],
  slot,
  material: "Cotton",
  fit: "Regular",
  pattern: "Solid",
});

describe("stylist layering", () => {
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
  const sweater = makeItem({ id: "sw-1", type: "Sweater", colour: "Grey" });
  const hoodie = makeItem({ id: "hd-1", type: "Hoodie", colour: "Black" });
  const blazer = makeItem({ id: "bl-1", type: "Blazer", colour: "Navy" });
  const jacket = makeItem({ id: "jk-1", type: "Jacket", colour: "Denim" });
  const coat = makeItem({ id: "ct-1", type: "Coat", colour: "Black" });
  const tie = makeItem({
    id: "tie-1",
    type: "Tie",
    colour: "Red",
    slot: "head",
  });
  const jeans = makeItem({
    id: "jn-1",
    type: "Jeans",
    colour: "Navy",
    slot: "legs",
  });
  const shoes = makeItem({
    id: "sh-1",
    type: "Shoes",
    colour: "Brown",
    slot: "feet",
  });
  const heavySweater = makeItem({
    id: "hsw-1",
    type: "Heavy Sweater",
    colour: "Grey",
  });

  it("maps types to layer roles with backward-compatible defaults", () => {
    expect(resolveLayerRoles(tee)).to.deep.equal(["base_top"]);
    expect(resolveLayerRoles(sweater)).to.include("mid_layer");
    expect(resolveLayerRoles(blazer)).to.deep.equal(["outer_layer"]);
    expect(resolveLayerRoles(tie)).to.deep.equal(["neckwear"]);
    expect(resolveLayerRoles(buttonUp)).to.include.members([
      "mid_layer",
      "base_top",
    ]);
    expect(getLayeringMetadata(dressShirt).supportsTie).to.equal(true);
  });

  it("accepts T-shirt + open button-up", () => {
    const result = validateLayerCombination({
      baseTop: tee,
      midLayer: buttonUp,
      outerLayer: null,
      neckwear: null,
    });
    expect(result.ok).to.equal(true);
    expect(result.wearState[buttonUp._id]).to.equal("open");
  });

  it("accepts T-shirt + sweater", () => {
    expect(
      validateLayerCombination({
        baseTop: tee,
        midLayer: sweater,
      }).ok,
    ).to.equal(true);
  });

  it("accepts shirt + sweater", () => {
    expect(
      validateLayerCombination({
        baseTop: dressShirt,
        midLayer: sweater,
      }).ok,
    ).to.equal(true);
  });

  it("accepts shirt + tie", () => {
    const result = validateLayerCombination({
      baseTop: dressShirt,
      neckwear: tie,
    });
    expect(result.ok).to.equal(true);
    expect(result.wearState[dressShirt._id]).to.equal("closed");
  });

  it("accepts shirt + tie + blazer", () => {
    expect(
      validateLayerCombination({
        baseTop: dressShirt,
        outerLayer: blazer,
        neckwear: tie,
      }).ok,
    ).to.equal(true);
  });

  it("rejects T-shirt + tie", () => {
    const result = validateLayerCombination({
      baseTop: tee,
      neckwear: tie,
    });
    expect(result.ok).to.equal(false);
    expect(result.reason).to.match(/tie/);
  });

  it("rejects tie without a collared shirt", () => {
    const result = validateLayerCombination({
      midLayer: sweater,
      neckwear: tie,
    });
    expect(result.ok).to.equal(false);
    // Mid without base is invalid; also covers tie without collar when no base
    expect(result.reason).to.match(/missing_base_top|tie/);
  });

  it("rejects tie on a non-collared base", () => {
    const result = validateLayerCombination({
      baseTop: tee,
      neckwear: tie,
    });
    expect(result.ok).to.equal(false);
    expect(result.reason).to.match(/tie/);
  });

  it("preserves required T-shirt + button-up as base + mid", () => {
    const { plans } = resolveRequiredLayerInterpretations([tee, buttonUp]);
    expect(plans.length).to.be.greaterThan(0);
    const layered = plans.find(
      (p) =>
        p.baseTop &&
        p.baseTop._id === tee._id &&
        p.midLayer &&
        p.midLayer._id === buttonUp._id,
    );
    expect(layered).to.exist;
  });

  it("preserves required shirt + tie", () => {
    const { plans } = resolveRequiredLayerInterpretations([dressShirt, tie]);
    expect(
      plans.some(
        (p) => p.baseTop?._id === dressShirt._id && p.neckwear?._id === tie._id,
      ),
    ).to.equal(true);
  });

  it("allows sweater to add a shirt underneath", () => {
    const wardrobe = [tee, dressShirt, sweater, jeans, shoes];
    const result = generateLayerCombinations({
      wardrobe,
      requiredItems: [sweater],
      preferences: { weather: "Mild", occasion: "Everyday", style: "Casual" },
      mode: "selected",
    });
    const withBase = result.combinations.filter(
      (c) => c.midLayer?._id === sweater._id && c.baseTop,
    );
    expect(withBase.length).to.be.greaterThan(0);
  });

  it("improve mode may add a layer without dropping required items", () => {
    const wardrobe = [tee, buttonUp, jacket, jeans, shoes];
    const bySlot = groupBySlot(wardrobe);
    const constraints = buildConstraints({
      mode: "improve",
      requiredItemIds: [tee._id, jeans._id],
      requiredItems: [tee, jeans],
      preferences: { weather: "Mild", occasion: "Everyday", style: "Casual" },
    });
    const combos = generateConstrainedCandidates(bySlot, constraints);
    expect(combos.length).to.be.greaterThan(0);
    for (const combo of combos) {
      const ids = combo.items.map((i) => i._id);
      expect(ids).to.include(tee._id);
      expect(ids).to.include(jeans._id);
    }
    const withMid = combos.some(
      (c) => c.layering?.midLayerId || c.layering?.outerLayerId,
    );
    expect(withMid).to.equal(true);
  });

  it("random mode returns varied layer structures", () => {
    const wardrobe = [
      tee,
      buttonUp,
      dressShirt,
      sweater,
      jacket,
      blazer,
      jeans,
      shoes,
      tie,
    ];
    const result = generateLayerCombinations({
      wardrobe,
      requiredItems: [],
      preferences: { weather: "Cold", occasion: "Everyday", style: "Casual" },
      mode: "random",
    });
    const depths = new Set(
      result.combinations.map(
        (c) =>
          [c.baseTop, c.midLayer, c.outerLayer, c.neckwear].filter(Boolean)
            .length,
      ),
    );
    expect(depths.size).to.be.greaterThan(1);
  });

  it("rejects or penalizes heavy incompatible layers", () => {
    const hoodieBlazer = validateLayerCombination({
      midLayer: hoodie,
      outerLayer: blazer,
    });
    expect(hoodieBlazer.ok).to.equal(false);

    const heavyPair = scoreLayerCombination({
      midLayer: heavySweater,
      outerLayer: coat,
      preferences: { weather: "Cold" },
    });
    expect(heavyPair.rejected || heavyPair.total < 0.5).to.equal(true);
  });

  it("resolves button-up as base or mid layer", () => {
    const { plans: alone } = resolveRequiredLayerInterpretations([buttonUp]);
    expect(alone.some((p) => p.baseTop?._id === buttonUp._id)).to.equal(true);
    expect(alone.some((p) => p.midLayer?._id === buttonUp._id)).to.equal(true);

    const { plans: withTee } = resolveRequiredLayerInterpretations([
      tee,
      buttonUp,
    ]);
    expect(
      withTee.some(
        (p) => p.baseTop?._id === tee._id && p.midLayer?._id === buttonUp._id,
      ),
    ).to.equal(true);
  });

  it("sets wear state open over T-shirt and closed with tie", () => {
    const open = validateLayerCombination({
      baseTop: tee,
      midLayer: buttonUp,
    });
    expect(open.wearState[buttonUp._id]).to.equal("open");

    const closed = validateLayerCombination({
      baseTop: dressShirt,
      neckwear: tie,
    });
    expect(closed.wearState[dressShirt._id]).to.equal("closed");
  });

  it("validator rejects invented IDs and keeps required items", () => {
    const allowedIds = new Set([tee._id, jeans._id, shoes._id, buttonUp._id]);
    const cleaned = validateOutfitRecommendations({
      recommendations: [
        {
          label: "Safe Choice",
          name: "A",
          itemIds: [tee._id, jeans._id, shoes._id],
          explanation: "ok",
        },
        {
          label: "Styled Choice",
          name: "B",
          itemIds: [tee._id, buttonUp._id, jeans._id, shoes._id],
          explanation: "layered",
          layering: {
            baseTopId: tee._id,
            midLayerId: buttonUp._id,
            wearState: { [buttonUp._id]: "open" },
          },
        },
        {
          label: "Alternative",
          name: "Bad",
          itemIds: [tee._id, "fake-id", jeans._id, shoes._id],
          explanation: "invented",
        },
      ],
      allowedIds,
      requiredItemIds: [tee._id],
    });
    expect(cleaned.length).to.equal(2);
    expect(cleaned.every((r) => r.itemIds.includes(tee._id))).to.equal(true);
  });

  it("strips invalid layering IDs without inventing combinations", () => {
    const allowedIds = new Set([tee._id, jeans._id, shoes._id]);
    const cleaned = validateOutfitRecommendations({
      recommendations: [
        {
          label: "Safe Choice",
          name: "A",
          itemIds: [tee._id, jeans._id, shoes._id],
          explanation: "ok",
          layering: {
            baseTopId: tee._id,
            midLayerId: "not-in-outfit",
          },
        },
        {
          label: "Styled Choice",
          name: "B",
          itemIds: [tee._id, jeans._id, shoes._id, "x"],
          explanation: "bad ids",
        },
        {
          label: "Alternative",
          name: "C",
          itemIds: [tee._id, jeans._id, shoes._id],
          explanation: "dup",
        },
      ],
      allowedIds,
    });
    // First kept without bad layering; second rejected (unknown id); third duplicate of first
    expect(cleaned.length).to.equal(1);
    expect(cleaned[0].layering).to.equal(undefined);
  });

  it("keeps non-layered single-top outfits working", () => {
    const wardrobe = [tee, jeans, shoes];
    const bySlot = groupBySlot(wardrobe);
    const constraints = buildConstraints({
      mode: "random",
      requiredItemIds: [],
      requiredItems: [],
      preferences: { weather: "Warm", occasion: "Everyday", style: "Casual" },
    });
    const combos = generateConstrainedCandidates(bySlot, constraints);
    expect(combos.length).to.be.greaterThan(0);
    expect(combos[0].items.map((i) => i._id)).to.include.members([
      tee._id,
      jeans._id,
      shoes._id,
    ]);
  });

  it("feedback-shaped payload still uses whole-outfit itemIds", () => {
    const rec = {
      id: "r1",
      label: "Safe Choice",
      itemIds: [tee._id, buttonUp._id, jeans._id, shoes._id],
      layering: {
        baseTopId: tee._id,
        midLayerId: buttonUp._id,
        wearState: { [buttonUp._id]: "open" },
      },
    };
    // Whole-outfit feedback attaches to itemIds, not individual layers
    expect(rec.itemIds).to.have.length(4);
    expect(rec.layering.midLayerId).to.equal(buttonUp._id);
  });
});
