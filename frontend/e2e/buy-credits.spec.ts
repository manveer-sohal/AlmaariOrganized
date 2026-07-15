import { test, expect } from "@playwright/test";

test.describe("Buy credits billing auth", () => {
  test.beforeEach(async ({ page }) => {
    if (!process.env.E2E_AUTH0_EMAIL || !process.env.E2E_AUTH0_PASSWORD) {
      test.skip(
        true,
        "Set E2E_AUTH0_EMAIL and E2E_AUTH0_PASSWORD to run this test",
      );
    }
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("starts checkout without invalid access token error", async ({
    page,
  }) => {
    let createPaymentIntentStatus: number | null = null;
    let hadAuthorizationHeader = false;

    await page.route("**/api/billing/create-payment-intent", async (route) => {
      hadAuthorizationHeader = !!route
        .request()
        .headers()
        .authorization?.startsWith("Bearer ");
      const response = await route.fetch();
      createPaymentIntentStatus = response.status();
      await route.fulfill({ response });
    });

    // Open buy credits from the sidebar credits button.
    await page.getByRole("button", { name: /\+ Buy more/i }).click();
    await expect(page.getByRole("heading", { name: /top up your credits/i })).toBeVisible();

    // Start the starter package checkout.
    await page.getByRole("button", { name: /get \d+ credits/i }).first().click();

    await expect
      .poll(() => createPaymentIntentStatus, { timeout: 30_000 })
      .not.toBeNull();

    expect(hadAuthorizationHeader).toBe(true);
    expect(createPaymentIntentStatus).toBe(200);

    await expect(page.getByText(/invalid or expired access token/i)).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("heading", { name: /complete your purchase/i }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
