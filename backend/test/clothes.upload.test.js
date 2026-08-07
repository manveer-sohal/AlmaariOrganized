import { describe, it, beforeEach, afterEach, before, after } from "mocha";
import { expect } from "chai";
import request from "supertest";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./setupTestDB.js";
import app from "../App.js";
import sinon from "sinon";
import { TEST_BEARER } from "./testAuth.js";

describe("Clothes Upload Test", () => {
  before(async () => {
    await connectTestDB();
  });

  after(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("Should return a 400 status of file is not provided", async () => {
    const res = await request(app)
      .post("/api/clothes/upload")
      .set("Authorization", TEST_BEARER)
      .field({ type: "shirt" });
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal("No file uploaded");
  });

  it("Should return a 404 status code if user is not found", async () => {
    const res = await request(app)
      .post("/api/clothes/upload")
      .set("Authorization", TEST_BEARER)
      .field({
        type: "shirt",
        colour: JSON.stringify(["blue"]),
        season: JSON.stringify(["summer"]),
        waterproof: "false",
        favourite: "false",
        material: "Cotton",
        fit: "Regular",
        pattern: "Solid",
      })
      .attach(
        "image",
        Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
          0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
          0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde,
          0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63,
          0xf8, 0xff, 0xff, 0x3f, 0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc,
          0x59, 0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
          0x42, 0x60, 0x82,
        ]),
        "test-image.png",
      );

    expect(res.status).to.equal(404);
  });
});
