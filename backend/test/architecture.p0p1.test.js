import { expect } from "chai";
import {
  invalidateUserClothesCache,
} from "../utils/cacheInvalidation.js";
import { clothesCacheKeys } from "../utils/cacheKeys.js";
import { summarizeImageSrcMeta } from "../utils/safeImageLog.js";
import { resolveClothingImage } from "../utils/resolveClothingImage.js";
import {
  STYLIST_CLOTHING_PROJECTION,
  assertNoImageSrc,
} from "../constants/stylistProjection.js";
import {
  validateIdempotencyKey,
  fingerprintImageBuffer,
} from "../services/idempotency.service.js";
import { serviceAuthHeaders } from "../utils/serviceAuth.js";

describe("P0/P1 architecture helpers", () => {
  describe("safeImageLog", () => {
    it("never returns the base64 body", () => {
      const src =
        "data:image/png;base64," + Buffer.from("hello-world-image").toString("base64");
      const meta = summarizeImageSrcMeta(src);
      expect(meta.kind).to.equal("data_url");
      expect(JSON.stringify(meta)).to.not.include("hello-world");
      expect(meta.encodedBytes).to.be.a("number");
    });
  });

  describe("resolveClothingImage", () => {
    it("falls back to legacy imageSrc", () => {
      const r = resolveClothingImage({
        imageSrc: "data:image/png;base64,abc",
      });
      expect(r.imageStatus).to.equal("legacy_base64");
      expect(r.imageSrc.startsWith("data:")).to.equal(true);
    });

    it("prefers object storage URL when present", () => {
      const r = resolveClothingImage({
        imageSrc: "data:image/png;base64,abc",
        imageStorage: {
          provider: "s3",
          displayUrl: "https://cdn.example/x.png",
          thumbnailUrl: "https://cdn.example/x-thumb.png",
        },
      });
      expect(r.imageStatus).to.equal("object_storage");
      expect(r.imageUrl).to.equal("https://cdn.example/x.png");
    });
  });

  describe("cache invalidation", () => {
    it("scans paginated keys and deletes them", async () => {
      const keys = [
        clothesCacheKeys.page("auth|1", 1, 40),
        clothesCacheKeys.page("auth|1", 2, 40),
        clothesCacheKeys.page("auth|1", 1, 20),
      ];
      const deleted = [];
      const fakeRedis = {
        scanIterator: async function* () {
          for (const k of keys) yield k;
        },
        del: async (...args) => {
          deleted.push(...args);
        },
      };

      const result = await invalidateUserClothesCache("auth|1", {
        client: fakeRedis,
      });
      expect(result.ok).to.equal(true);
      expect(deleted.length).to.be.at.least(3);
    });

    it("is non-fatal when redis throws", async () => {
      const fakeRedis = {
        scanIterator: async function* () {
          throw new Error("boom");
        },
        del: async () => {},
      };
      const result = await invalidateUserClothesCache("auth|1", {
        client: fakeRedis,
      });
      expect(result.ok).to.equal(false);
    });
  });

  describe("stylist projection", () => {
    it("excludes imageSrc from projection", () => {
      expect(STYLIST_CLOTHING_PROJECTION.imageSrc).to.equal(undefined);
      expect(STYLIST_CLOTHING_PROJECTION.type).to.equal(1);
    });

    it("assertNoImageSrc throws in non-production when present", () => {
      expect(() =>
        assertNoImageSrc([{ _id: "1", imageSrc: "x" }], "test"),
      ).to.throw(/imageSrc/);
    });
  });

  describe("idempotency helpers", () => {
    it("validates keys", () => {
      expect(validateIdempotencyKey("op_abc-123").ok).to.equal(true);
      expect(validateIdempotencyKey("bad key!").ok).to.equal(false);
    });

    it("fingerprints buffers without retaining them", () => {
      const a = fingerprintImageBuffer(Buffer.from("abc"), { op: "upload" });
      const b = fingerprintImageBuffer(Buffer.from("abc"), { op: "upload" });
      const c = fingerprintImageBuffer(Buffer.from("abd"), { op: "upload" });
      expect(a).to.equal(b);
      expect(a).to.not.equal(c);
    });
  });

  describe("service auth headers", () => {
    it("attaches crop key when configured", () => {
      const prev = process.env.CROP_SERVICE_API_KEY;
      process.env.CROP_SERVICE_API_KEY = "crop-secret";
      const headers = serviceAuthHeaders("crop");
      expect(headers["X-Almaari-Service-Key"]).to.equal("crop-secret");
      process.env.CROP_SERVICE_API_KEY = prev;
    });
  });
});
