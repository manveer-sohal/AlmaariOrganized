import request from "supertest";
import { expect } from "chai";
import app from "../App.js";

describe("AI warmup authentication", () => {
  it("rejects unauthenticated warmup", async () => {
    const res = await request(app).get("/api/ai/warmup");
    expect(res.status).to.equal(401);
  });

  it("accepts test bearer token", async () => {
    const res = await request(app)
      .get("/api/ai/warmup")
      .set("Authorization", "Bearer test-access-token");
    // Downstream services may be unavailable in test — still authorized.
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("status", "accepted");
  });
});
