import { describe, it, beforeEach, afterEach, before, after } from "mocha";
import { expect } from "chai";
import request from "supertest";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./setupTestDB.js";
import { User } from "../models/Users.js";
import { seedTestUserWithClothes } from "./setupTestDB.js";
import app from "../app.js";
import sinon from "sinon";

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
    const { user } = await seedTestUserWithClothes();

    const res = await request(app)
      .post("/api/clothes/listClothes")
      .send({ auth0Id: user.auth0Id });
    expect(res.status).to.equal(200);
    expect(res.body.Clothes.length).to.equal(2);
  });

  it("Should return a 404 status code if user is not found", async () => {
    sinon.stub(User, "findOne").resolves(null);

    const res = await request(app)
      .post("/api/clothes/listClothes")
      .send({ auth0Id: "test-auth0-id" });

    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal("User Not Found");
  });
});
