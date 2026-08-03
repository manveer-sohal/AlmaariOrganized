import { describe, expect, it } from "vitest";
import { getRadianAngle, rotateSize } from "./getCroppedClothingBlob";

describe("getCroppedClothingBlob helpers", () => {
  it("returns same dimensions at 0° rotation", () => {
    expect(rotateSize(800, 600, 0)).toEqual({ width: 800, height: 600 });
  });

  it("swaps bounding box at 90° rotation", () => {
    expect(rotateSize(800, 600, 90)).toEqual({ width: 600, height: 800 });
  });

  it("computes square bounding box at 45°", () => {
    const { width, height } = rotateSize(800, 600, 45);
    expect(width).toBeCloseTo(989.95, 1);
    expect(height).toBeCloseTo(989.95, 1);
  });

  it("converts degrees to radians", () => {
    expect(getRadianAngle(180)).toBeCloseTo(Math.PI, 5);
  });
});
