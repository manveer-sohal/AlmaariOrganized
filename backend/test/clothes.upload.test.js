import { describe, it, beforeEach, afterEach, before, after } from "mocha";
import { expect } from "chai";
import request from "supertest";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./setupTestDB.js";
import { User } from "../models/Users.js";
import app from "../app.js";
import sinon from "sinon";

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
      .field({ auth0Id: "test-auth0-id" });
    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal("No file uploaded");
  });

  it("Should return a 404 status code if user is not found", async () => {
    sinon.stub(User, "findOne").resolves(null);

    const res = await request(app)
      .post("/api/clothes/upload")
      .field({
        auth0Id: "test-auth0-id",
        type: "shirt",
        colour: "blue",
        season: "summer",
        waterproof: "false",
        favourite: "false",
      })
      .attach("image", Buffer.from("fake image data"), "test-image.png")
      .set("Content-Type", "multipart/form-data");

    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal("User Not Found");
  });
});
