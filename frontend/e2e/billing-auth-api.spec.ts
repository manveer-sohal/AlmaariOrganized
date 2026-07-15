import { test, expect } from "@playwright/test";

test.describe("Billing API auth enforcement", () => {
  test("create-payment-intent rejects unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.post("/api/billing/create-payment-intent", {
      data: { packageId: "starter" },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toMatch(/bearer token|unauthorized/i);
  });

  test("purchase-status rejects unauthenticated requests", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/billing/purchase-status/pi_test_unauthenticated",
    );

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.message).toMatch(/bearer token|unauthorized/i);
  });
});
