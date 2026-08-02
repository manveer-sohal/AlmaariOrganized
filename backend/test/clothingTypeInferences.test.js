import { expect } from "chai";
import {
  applyClothingTypeInferences,
  resolveClothingTypeKey,
} from "../utils/clothingTypeInferences.js";
import { normalizeClothingAnalysisResponse } from "../utils/normalizeClothingAnalysisResponse.js";

describe("clothingTypeInferences", () => {
  it("resolves chinos from type and subtype", () => {
    expect(resolveClothingTypeKey("Chinos", null)).to.equal("chinos");
    expect(resolveClothingTypeKey("Trousers", "chinos")).to.equal("chinos");
  });

  it("forces cotton material for chinos", () => {
    const core = applyClothingTypeInferences(
      {
        type: { value: "Chinos", confidence: 0.9 },
        colour: { value: ["Beige"], confidence: 0.8 },
        material: { value: "Polyester", confidence: 0.7 },
        fit: { value: "Regular", confidence: 0.6 },
        pattern: { value: "Solid", confidence: 0.6 },
      },
      null,
    );

    expect(core.material.value).to.equal("Cotton");
    expect(core.material.confidence).to.be.at.least(0.92);
  });

  it("forces denim for jeans", () => {
    const core = applyClothingTypeInferences(
      {
        type: { value: "Jeans", confidence: 0.9 },
        colour: { value: ["Blue"], confidence: 0.8 },
        material: { value: "Cotton", confidence: 0.7 },
        fit: { value: "Slim", confidence: 0.6 },
        pattern: { value: "Solid", confidence: 0.6 },
      },
      null,
    );

    expect(core.material.value).to.equal("Denim");
  });

  it("applies during normalizeClothingAnalysisResponse", () => {
    const normalized = normalizeClothingAnalysisResponse({
      type: { value: "Chinos", confidence: 0.88 },
      colour: { value: ["Khaki"], confidence: 0.8 },
      material: { value: "Polyester", confidence: 0.55 },
      fit: { value: "Regular", confidence: 0.7 },
      pattern: { value: "Solid", confidence: 0.7 },
    });

    expect(normalized.core.material.value).to.equal("Cotton");
  });
});
