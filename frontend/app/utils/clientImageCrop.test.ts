import { describe, expect, it } from "vitest";
import {
  ABSOLUTE_MIN_USER_ZOOM,
  CROP_OUTPUT_SIZE,
  CROP_WORK_MAX_EDGE,
  normalizeCropRotation,
} from "./clientImageCrop";

describe("clientImageCrop constants", () => {
  it("matches image_cropper output and max edge defaults", () => {
    expect(CROP_OUTPUT_SIZE).toBe(512);
    expect(CROP_WORK_MAX_EDGE).toBe(640);
    expect(ABSOLUTE_MIN_USER_ZOOM).toBeGreaterThan(0);
  });
});

describe("normalizeCropRotation", () => {
  it("normalizes rotation to -180..180", () => {
    expect(normalizeCropRotation(370)).toBe(10);
    expect(normalizeCropRotation(-370)).toBe(-10);
    expect(normalizeCropRotation(180)).toBe(180);
  });

  it("rounds to one decimal place", () => {
    expect(normalizeCropRotation(12.34)).toBe(12.3);
  });
});
