import { expect } from "chai";
import {
  generateCandidateOutfits,
  groupBySlot,
  preferenceMatch,
  pickDiverseOutfits,
  scoreOutfit,
} from "../utils/aiStylistScoring.js";
import { serializeWardrobeItemForStylist } from "../utils/serializeWardrobeItem.js";

const makeItem = ({
  id,
  type,
  colour,
  slot = "body",
}) => ({
  _id: id,
  type,
  colour: Array.isArray(colour) ? colour : [colour],
  slot,
  material: "Cotton",
  fit: "Regular",
  pattern: "Solid",
});

describe("stylist preference scoring", () => {
  const basePreferences = {
    occasion: "Everyday",
    weather: "Mild",
    style: "Casual",
  };

  const navyJeans = makeItem({
    id: "item-navy-jeans",
    type: "Jeans",
    colour: "Navy",
    slot: "legs",
  });
  const neonCargo = makeItem({
    id: "item-neon-cargo",
    type: "Cargos",
    colour: "Orange",
    slot: "legs",
  });
  const whiteTee = makeItem({
    id: "item-white-tee",
    type: "T-shirt",
    colour: "White",
    slot: "body",
  });
  const sneakers = makeItem({
    id: "item-sneakers",
    type: "Shoes",
    colour: "White",
    slot: "feet",
  });

  it("returns neutral preferenceMatch for an empty/cold-start profile", () => {
    expect(preferenceMatch([navyJeans, whiteTee], null)).to.equal(0.5);
    expect(
      preferenceMatch([navyJeans, whiteTee], { isEmpty: true }),
    ).to.equal(0.5);
  });

  it("keeps cold-start scoreOutfit ordering equivalent to baseline preference weight", () => {
    const likedOutfit = [whiteTee, navyJeans, sneakers];
    const otherOutfit = [whiteTee, neonCargo, sneakers];

    const coldScoreLiked = scoreOutfit(likedOutfit, basePreferences, {
      isEmpty: true,
    });
    const coldScoreOther = scoreOutfit(otherOutfit, basePreferences, {
      isEmpty: true,
    });
    const noProfileLiked = scoreOutfit(likedOutfit, basePreferences);
    const noProfileOther = scoreOutfit(otherOutfit, basePreferences);

    expect(coldScoreLiked).to.be.closeTo(noProfileLiked, 0.0001);
    expect(coldScoreOther).to.be.closeTo(noProfileOther, 0.0001);
  });

  it("boosts outfits that match liked colours and types", () => {
    const profile = {
      isEmpty: false,
      typeWeights: { jeans: 0.8 },
      colourWeights: { navy: 0.9 },
      itemWeights: {},
    };

    const likedScore = scoreOutfit(
      [whiteTee, navyJeans, sneakers],
      basePreferences,
      profile,
    );
    const otherScore = scoreOutfit(
      [whiteTee, neonCargo, sneakers],
      basePreferences,
      profile,
    );

    expect(likedScore).to.be.greaterThan(otherScore);
    expect(preferenceMatch([navyJeans], profile)).to.be.greaterThan(0.5);
  });

  it("penalizes outfits that include disliked item IDs", () => {
    const profile = {
      isEmpty: false,
      typeWeights: {},
      colourWeights: {},
      itemWeights: {
        "item-neon-cargo": -0.9,
      },
    };

    const withDisliked = scoreOutfit(
      [whiteTee, neonCargo, sneakers],
      basePreferences,
      profile,
    );
    const withoutDisliked = scoreOutfit(
      [whiteTee, navyJeans, sneakers],
      basePreferences,
      profile,
    );

    expect(withDisliked).to.be.lessThan(withoutDisliked);
    expect(preferenceMatch([neonCargo], profile)).to.be.lessThan(0.5);
  });

  it("excludes recently downvoted outfit signatures from diversity picks", () => {
    const hated = {
      items: [whiteTee, neonCargo, sneakers],
      score: 0.99,
    };
    const altA = {
      items: [whiteTee, navyJeans, sneakers],
      score: 0.8,
    };
    const altB = {
      items: [
        makeItem({
          id: "item-hoodie",
          type: "Hoodie",
          colour: "Grey",
          slot: "body",
        }),
        makeItem({
          id: "item-black-pants",
          type: "Pants",
          colour: "Black",
          slot: "legs",
        }),
        makeItem({
          id: "item-boots",
          type: "Shoes",
          colour: "Brown",
          slot: "feet",
        }),
      ],
      score: 0.75,
    };

    const hatedSignature = [whiteTee, neonCargo, sneakers]
      .map((i) => i._id)
      .sort()
      .join("|");

    const selected = pickDiverseOutfits(
      [hated, altA, altB],
      2,
      [hatedSignature],
    );

    expect(selected).to.have.length(2);
    expect(
      selected.some((candidate) =>
        candidate.items.some((item) => item._id === "item-neon-cargo"),
      ),
    ).to.equal(false);
  });

  it("still generates dress+shoes outfits when many non-dress tops exist and legs are empty", () => {
    const shoes = makeItem({
      id: "shoes-1",
      type: "Shoes",
      colour: "Black",
      slot: "feet",
    });
    const dress = makeItem({
      id: "dress-1",
      type: "Dress",
      colour: "Red",
      slot: "body",
    });
    const manyTops = Array.from({ length: 12 }, (_, index) =>
      makeItem({
        id: `top-${index}`,
        type: "T-shirt",
        colour: "White",
        slot: "body",
      }),
    );

    const bySlot = groupBySlot([...manyTops, dress, shoes]);
    const combos = generateCandidateOutfits(bySlot, null);
    expect(combos.length).to.be.greaterThan(0);
    expect(
      combos.every((items) => items.some((item) => item._id === "dress-1")),
    ).to.equal(true);
  });

  it("includes an anchor body item even when it falls outside the default slice", () => {
    const shoes = makeItem({
      id: "shoes-1",
      type: "Shoes",
      colour: "Black",
      slot: "feet",
    });
    const jeans = makeItem({
      id: "jeans-1",
      type: "Jeans",
      colour: "Blue",
      slot: "legs",
    });
    const tops = Array.from({ length: 12 }, (_, index) =>
      makeItem({
        id: `top-${index}`,
        type: "Shirt",
        colour: "White",
        slot: "body",
      }),
    );
    const anchor = tops[11];
    const bySlot = groupBySlot([...tops, jeans, shoes]);
    const combos = generateCandidateOutfits(bySlot, anchor);
    expect(combos.length).to.be.greaterThan(0);
    expect(
      combos.every((items) =>
        items.some((item) => item._id === anchor._id),
      ),
    ).to.equal(true);
  });

  it("scores and serializes legacy items without stylingMetadata", () => {
    const outfit = [
      makeItem({
        id: "legacy-top",
        type: "Shirt",
        colour: "White",
        slot: "body",
      }),
      makeItem({
        id: "legacy-legs",
        type: "Jeans",
        colour: "Blue",
        slot: "legs",
      }),
      makeItem({
        id: "legacy-feet",
        type: "Shoes",
        colour: "Black",
        slot: "feet",
      }),
    ];

    const score = scoreOutfit(outfit, basePreferences, { isEmpty: true });
    expect(score).to.be.a("number");
    expect(Number.isNaN(score)).to.equal(false);

    const serialized = serializeWardrobeItemForStylist(outfit[0]);
    expect(serialized.styleCategory).to.equal(undefined);
    expect(serialized.formalityScore).to.equal(undefined);
    expect(serialized.id).to.equal("legacy-top");
  });
});
