import { describe, it, beforeEach, afterEach, before, after } from "mocha";
import { expect } from "chai";
import request from "supertest";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./setupTestDB.js";
import { seedTestUserWithClothes } from "./setupTestDB.js";
import app from "../App.js";
import sinon from "sinon";
import { TEST_BEARER } from "./testAuth.js";

describe("Clothes List Test", () => {
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

  it("should return a 200 status code for listClothes", async () => {
    await seedTestUserWithClothes();

    const res = await request(app)
      .post("/api/clothes/listClothes")
      .set("Authorization", TEST_BEARER)
      .send({ page: 1, numberOfClothes: 40 });
    expect(res.status).to.equal(200);
    expect(res.body.Clothes.length).to.equal(2);
  });

  it("Should return a 404 status code if user is not found", async () => {
    const res = await request(app)
      .post("/api/clothes/listClothes")
      .set("Authorization", TEST_BEARER)
      .send({ page: 1, numberOfClothes: 40 });

    expect(res.status).to.equal(404);
  });
});
