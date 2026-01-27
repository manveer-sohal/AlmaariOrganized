import request from "supertest";
import { describe, it, before, after, beforeEach } from "mocha";
import { expect } from "chai";
import app from "../App.js";
import {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  seedTestUserWithClothes,
} from "./setupTestDB.js";

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
    const res = await request(app)
      .post("/api/clothes/listClothes")
      .send({ auth0Id: "does-not-exist" });

    expect(res.status).to.equal(404);
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
