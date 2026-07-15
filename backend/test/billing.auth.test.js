import { expect } from "chai";
import sinon from "sinon";
import { authenticateBearerToken } from "../middleware/authenticateBearerToken.js";

describe("authenticateBearerToken", () => {
  let fetchStub;

  beforeEach(() => {
    process.env.AUTH0_DOMAIN = "test-tenant.auth0.com";
    process.env.AUTH0_CLIENT_ID = "test-client-id";
    fetchStub = sinon.stub(global, "fetch");
  });

  afterEach(() => {
    fetchStub.restore();
    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_CLIENT_ID;
  });

  it("accepts opaque access tokens using the /userinfo response", async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({
        sub: "auth0|opaque-user",
        email: "buyer@example.com",
      }),
    });

    const result = await authenticateBearerToken({
      headers: { authorization: "Bearer opaque-non-jwt-token" },
    });

    expect(result.error).to.equal(undefined);
    expect(result.auth.sub).to.equal("auth0|opaque-user");
    expect(result.auth.email).to.equal("buyer@example.com");
    expect(fetchStub.calledOnce).to.equal(true);
    expect(fetchStub.firstCall.args[0]).to.equal(
      "https://test-tenant.auth0.com/userinfo",
    );
  });

  it("rejects tokens when /userinfo fails and JWT verification fails", async () => {
    fetchStub.onFirstCall().resolves({ ok: false, status: 401 });
    fetchStub.onSecondCall().resolves({ ok: true, json: async () => ({ keys: [] }) });

    const result = await authenticateBearerToken({
      headers: { authorization: "Bearer bad-token" },
    });

    expect(result.error?.status).to.equal(401);
    expect(result.error?.message).to.equal("Invalid or expired access token");
  });

  it("rejects when /userinfo succeeds but has no sub and token is not a JWT", async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({}),
    });

    const result = await authenticateBearerToken({
      headers: { authorization: "Bearer token" },
    });

    expect(result.error?.status).to.equal(401);
    expect(result.error?.message).to.equal("Invalid or expired access token");
  });
});
