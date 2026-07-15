import { expect } from "chai";
import { resolveTopSubtype } from "../services/aiStylist/layering/topSubtypeResolver.js";
import { resolveGarmentOpenability } from "../services/aiStylist/layering/garmentOpenabilityResolver.js";
import { resolveWearState } from "../services/aiStylist/layering/wearStateResolver.js";
import { validateLayerCombination } from "../services/aiStylist/layering/layeringRules.js";
import { resolveLayerRoles } from "../services/aiStylist/layering/layerRoles.js";
import {
  isBeltType,
  bottomSupportsBelt,
  resolveAccessorySlot,
} from "../services/aiStylist/layering/beltResolver.js";
import { sanitizeRecommendationLayering } from "../services/aiStylist/layering/layeringValidator.js";
import { generateConstrainedCandidates } from "../services/aiStylist/candidateGenerator.js";
import { buildConstraints } from "../services/aiStylist/constraints.js";
import { groupBySlot } from "../utils/aiStylistScoring.js";

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

describe("stylist openability + belts", () => {
  const tee = makeItem({ id: "tee-1", type: "T-Shirt", colour: "White" });
  const genericShirt = makeItem({ id: "sh-1", type: "Shirt", colour: "Blue" });
  const polo = makeItem({ id: "po-1", type: "Polo", colour: "Navy" });
  const sweater = makeItem({ id: "sw-1", type: "Sweater", colour: "Grey" });
  const pulloverHoodie = makeItem({
    id: "hd-1",
    type: "Hoodie",
    colour: "Black",
  });
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
  const overshirt = makeItem({
    id: "os-1",
    type: "Overshirt",
    colour: "Olive",
  });
  const flannel = makeItem({ id: "fl-1", type: "Flannel", colour: "Red" });
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
  const trousers = makeItem({
    id: "tr-1",
    type: "Trousers",
    colour: "Black",
    slot: "legs",
  });
  const chinos = makeItem({
    id: "ch-1",
    type: "Chinos",
    colour: "Khaki",
    slot: "legs",
  });
  const sweatpants = makeItem({
    id: "sp-1",
    type: "Sweatpants",
    colour: "Grey",
    slot: "legs",
  });
  const joggers = makeItem({
    id: "jg-1",
    type: "Joggers",
    colour: "Black",
    slot: "legs",
  });
  const belt = makeItem({
    id: "belt-1",
    type: "Belt",
    colour: "Brown",
    slot: "head",
  });
  const shoes = makeItem({
    id: "shoe-1",
    type: "Shoes",
    colour: "Brown",
    slot: "feet",
  });

  it("does not treat generic Shirt as button_up or openable", () => {
    expect(resolveTopSubtype(genericShirt)).to.equal("other_top");
    expect(resolveGarmentOpenability(genericShirt).canWearOpen).to.equal(false);
    expect(resolveLayerRoles(genericShirt)).to.deep.equal(["base_top"]);
  });

  it("never marks T-shirt, polo, sweater, or pullover hoodie as open", () => {
    for (const item of [tee, polo, sweater, pulloverHoodie]) {
      expect(resolveGarmentOpenability(item).canWearOpen).to.equal(false);
      const wear = resolveWearState({
        item,
        assignedRole: "mid_layer",
        hasBaseLayerUnderneath: true,
      });
      expect(wear).to.equal("standard");
    }
  });

  it("allows button-up / overshirt / flannel open over a T-shirt", () => {
    for (const mid of [buttonUp, overshirt, flannel]) {
      const result = validateLayerCombination({
        baseTop: tee,
        midLayer: mid,
      });
      expect(result.ok).to.equal(true);
      expect(result.wearState[mid._id]).to.equal("open");
      expect(resolveGarmentOpenability(mid).canWearOpen).to.equal(true);
    }
  });

  it("keeps dress shirt closed with a tie", () => {
    const result = validateLayerCombination({
      baseTop: dressShirt,
      neckwear: tie,
    });
    expect(result.ok).to.equal(true);
    expect(result.wearState[dressShirt._id]).to.equal("closed");
  });

  it("rejects generic shirt as open mid over a T-shirt", () => {
    const result = validateLayerCombination({
      baseTop: tee,
      midLayer: genericShirt,
    });
    expect(result.ok).to.equal(false);
  });

  it("uses standard wear for sweater over T-shirt", () => {
    const result = validateLayerCombination({
      baseTop: tee,
      midLayer: sweater,
    });
    expect(result.ok).to.equal(true);
    expect(result.wearState[sweater._id]).to.equal("standard");
  });

  it("normalizes LLM open wear state on non-openable shirts", () => {
    const itemsById = new Map([
      [genericShirt._id, genericShirt],
      [tee._id, tee],
    ]);
    const sanitized = sanitizeRecommendationLayering({
      recommendation: {
        id: "r1",
        label: "Safe Choice",
        itemIds: [tee._id, genericShirt._id],
        layering: {
          baseTopId: tee._id,
          midLayerId: genericShirt._id,
          wearState: { [genericShirt._id]: "open" },
        },
      },
      itemsById,
    });
    expect(sanitized.layering.wearState[genericShirt._id]).to.equal("standard");
  });

  it("maps belts to waist_accessory", () => {
    expect(isBeltType(belt)).to.equal(true);
    expect(resolveAccessorySlot(belt)).to.equal("waist_accessory");
  });

  it("allows belts with jeans, trousers, and chinos", () => {
    expect(bottomSupportsBelt(jeans)).to.equal(true);
    expect(bottomSupportsBelt(trousers)).to.equal(true);
    expect(bottomSupportsBelt(chinos)).to.equal(true);
  });

  it("rejects belts with sweatpants and joggers", () => {
    expect(bottomSupportsBelt(sweatpants)).to.equal(false);
    expect(bottomSupportsBelt(joggers)).to.equal(false);
  });

  it("preserves a required belt with only compatible bottoms", () => {
    const wardrobe = [tee, jeans, sweatpants, belt, shoes];
    const constraints = buildConstraints({
      mode: "selected",
      requiredItemIds: [belt._id],
      requiredItems: [belt],
      preferences: { weather: "Mild", occasion: "Everyday", style: "Casual" },
    });
    const combos = generateConstrainedCandidates(
      groupBySlot(wardrobe),
      constraints,
    );
    expect(combos.length).to.be.greaterThan(0);
    for (const combo of combos) {
      const ids = combo.items.map((i) => i._id);
      expect(ids).to.include(belt._id);
      expect(ids).to.include(jeans._id);
      expect(ids).to.not.include(sweatpants._id);
      expect(combo.layering?.waistAccessoryId).to.equal(belt._id);
    }
  });

  it("keeps non-belt outfits rendering without waistAccessoryId", () => {
    const wardrobe = [tee, jeans, shoes];
    const constraints = buildConstraints({
      mode: "random",
      requiredItemIds: [],
      requiredItems: [],
      preferences: { weather: "Warm", occasion: "Everyday", style: "Casual" },
    });
    const combos = generateConstrainedCandidates(
      groupBySlot(wardrobe),
      constraints,
    );
    expect(combos.length).to.be.greaterThan(0);
    expect(combos[0].layering?.waistAccessoryId).to.equal(undefined);
  });

  it("ambiguous shirt metadata defaults to not openable", () => {
    const ambiguous = makeItem({
      id: "amb-1",
      type: "Shirt",
      name: "Soft Everyday Shirt",
    });
    expect(resolveTopSubtype(ambiguous)).to.equal("other_top");
    expect(resolveGarmentOpenability(ambiguous).canWearOpen).to.equal(false);
    expect(
      resolveWearState({
        item: ambiguous,
        assignedRole: "mid_layer",
        hasBaseLayerUnderneath: true,
      }),
    ).to.equal("standard");
  });
});
