import request from "supertest";
import { describe, it, before, after, beforeEach } from "mocha";
import { expect } from "chai";
import app from "../app.js";
import sinon from "sinon";
import { User } from "../models/Users.js";
import {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  seedTestUserWithClothes,
} from "./setupTestDB.js";
import { redis } from "../libs/redis.client.js";
describe("App Test", () => {
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

  it("should return a 200 status code", async () => {
    const res = await request(app).get("/");
    expect(res.status).to.equal(200);
  });

  it("should create a test user with seeded clothes", async () => {
    const { user, clothes } = await seedTestUserWithClothes();
    expect(user.auth0Id).to.equal("test-auth0-id");
    expect(clothes.length).to.equal(2);
  });
  it("should return 404 for a non-existent user", async () => {
    sinon.stub(User, "findOne").resolves(null);
    const res = await request(app)
      .post("/api/clothes/listClothes")
      .send({ auth0Id: "does-not-exist" });

    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal("User Not Found");
  });

  it("should support pagination for clothes", async () => {
    const { user } = await seedTestUserWithClothes();

    const res = await request(app)
      .post("/api/clothes/listClothes")
      .send({
        auth0Id: user.auth0Id,
        numberOfClothes: 1,
        page: 1,
      });

    expect(res.status).to.equal(200);
    expect(res.body.Clothes.length).to.equal(1);
  });
  it("should return clothes for a user", async () => {
    const { user } = await seedTestUserWithClothes();

    const res = await request(app)
      .post("/api/clothes/listClothes")
      .send({ auth0Id: user.auth0Id });

    expect(res.status).to.equal(200);
    expect(res.body.Clothes.length).to.equal(2);
  });
});
