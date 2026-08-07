import { expect } from "chai";
import { buildClothingObjectKey, collectStorageKeys } from "../utils/objectKeyFactory.js";
import { resolveClothingImage } from "../utils/resolveClothingImage.js";
import { resolveAnalysisImageBase64 } from "../utils/resolveAnalysisImage.js";
import { toWardrobeListItem } from "../utils/clothesDto.js";
import {
  IMAGE_PROCESSING_STATUSES,
  PROCESSING_IMAGE_PLACEHOLDER,
} from "../constants/imageProcessing.js";
import { validateCroppedImageBuffer } from "../services/derivativeImage.service.js";

describe("P2 image architecture", () => {
  describe("object key factory", () => {
    it("builds namespaced keys without email", () => {
      const key = buildClothingObjectKey({
        userId: "507f1f77bcf86cd799439011",
        clothingId: "507f191e810c19729de860ea",
        variant: "canonical",
        version: 2,
        ext: "webp",
      });
      expect(key).to.equal(
        "users/507f1f77bcf86cd799439011/clothing/507f191e810c19729de860ea/canonical/v2.webp",
      );
      expect(key).to.not.include("@");
    });

    it("builds source keys with content hash", () => {
      const key = buildClothingObjectKey({
        userId: "u1",
        clothingId: "c1",
        variant: "source",
        contentHash: "abc123",
        ext: "png",
      });
      expect(key).to.match(/\/source\/abc123\.png$/);
    });

    it("collects keys for cleanup", () => {
      const keys = collectStorageKeys({
        source: { key: "a" },
        canonical: { key: "b" },
        display: { key: "c" },
        thumbnail: { key: "d" },
        originalKey: "e",
      });
      expect(keys.sort()).to.deep.equal(["a", "b", "c", "d", "e"]);
    });
  });

  describe("resolver invariant", () => {
    it("never uses source as wardrobe display for processing S3 records", () => {
      const r = resolveClothingImage({
        imageSrc: "data:image/png;base64,SHOULD_NOT_USE",
        imageStorage: {
          provider: "s3",
          status: "crop_pending",
          source: { key: "users/u/clothing/c/source/x.png" },
        },
      });
      expect(r.imageSrc).to.equal(PROCESSING_IMAGE_PLACEHOLDER);
      expect(r.imageStatus).to.equal("processing");
      expect(r.imageSrc).to.not.include("SHOULD_NOT_USE");
    });

    it("returns CDN thumbnail for ready S3 records", () => {
      process.env.IMAGE_CDN_BASE_URL = "https://images.example.com";
      const r = resolveClothingImage({
        imageSrc: "data:image/png;base64,legacy",
        imageStorage: {
          provider: "s3",
          status: "ready",
          thumbnail: { key: "users/u/clothing/c/thumbnail/v1.webp" },
          display: { key: "users/u/clothing/c/display/v1.webp" },
        },
      });
      expect(r.thumbnailUrl).to.include("images.example.com");
      expect(r.imageStatus).to.equal("ready");
      expect(r.imageSrc).to.not.include("data:image");
      delete process.env.IMAGE_CDN_BASE_URL;
    });

    it("keeps legacy Base64 for unmigrated records", () => {
      const src = "data:image/png;base64,abc";
      const r = resolveClothingImage({ imageSrc: src });
      expect(r.imageStatus).to.equal("legacy_base64");
      expect(r.imageSrc).to.equal(src);
    });
  });

  describe("wardrobe list DTO", () => {
    it("omits Base64 for ready S3 items", () => {
      process.env.IMAGE_CDN_BASE_URL = "https://cdn.example.com";
      const item = toWardrobeListItem({
        _id: "1",
        uniqueId: "u",
        type: "T-shirt",
        colour: ["Black"],
        material: "Cotton",
        fit: "Regular",
        pattern: "Solid",
        favourite: false,
        slot: "body",
        imageSrc: "data:image/png;base64,HUGE",
        imageStorage: {
          provider: "s3",
          status: "ready",
          thumbnail: { key: "t.webp" },
          display: { key: "d.webp" },
        },
      });
      expect(item.imageSrc).to.not.include("data:image");
      expect(JSON.stringify(item)).to.not.include("HUGE");
      expect(item.thumbnailUrl).to.include("cdn.example.com");
      delete process.env.IMAGE_CDN_BASE_URL;
    });
  });

  describe("crop validation", () => {
    it("rejects empty buffers", async () => {
      const r = await validateCroppedImageBuffer(Buffer.alloc(0));
      expect(r.ok).to.equal(false);
    });
  });

  describe("status enum", () => {
    it("includes mandatory crop states", () => {
      expect(IMAGE_PROCESSING_STATUSES).to.include("crop_pending");
      expect(IMAGE_PROCESSING_STATUSES).to.include("ready");
      expect(IMAGE_PROCESSING_STATUSES).to.include("crop_failed");
    });
  });

  describe("resolveAnalysisImageBase64", () => {
    it("strips data URLs for FastAPI", async () => {
      const b64 = await resolveAnalysisImageBase64({
        imageSrc: "data:image/png;base64,QUJD",
      });
      expect(b64).to.equal("QUJD");
    });

    it("loads canonical bytes from S3 instead of CDN imageSrc", async () => {
      let requestedKey = null;
      const b64 = await resolveAnalysisImageBase64(
        {
          imageSrc: "https://cdn.example.com/users/u/clothing/c/display/v1.webp",
          imageStorage: {
            provider: "s3",
            status: "ready",
            canonical: { key: "users/u/clothing/c/canonical/v1.webp" },
          },
        },
        {
          getAdapter: async () => ({
            provider: "s3",
            getObjectBuffer: async (key) => {
              requestedKey = key;
              return Buffer.from("png-bytes");
            },
          }),
        },
      );

      expect(requestedKey).to.equal("users/u/clothing/c/canonical/v1.webp");
      expect(b64).to.equal(Buffer.from("png-bytes").toString("base64"));
    });
  });
});
