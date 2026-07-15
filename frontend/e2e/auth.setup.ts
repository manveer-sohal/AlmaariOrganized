import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate test user", async ({ page }) => {
  const email = process.env.E2E_AUTH0_EMAIL;
  const password = process.env.E2E_AUTH0_PASSWORD;

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  if (!email || !password) {
    // Allow dependent specs to skip gracefully when creds are not configured.
    await page.context().storageState({ path: authFile });
    return;
  }

  await page.goto("/api/auth/login?returnTo=/dashboard");
  await page.waitForURL(/auth0\.com|\/dashboard/, { timeout: 60_000 });

  if (page.url().includes("auth0.com")) {
    await page.getByLabel(/email/i).fill(email);
    await page.getByRole("textbox", { name: /password/i }).fill(password);
    await page.getByRole("button", { name: /continue|log in|sign in/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 60_000 });
  }

  await expect(page).toHaveURL(/\/dashboard/);

  await page.context().storageState({ path: authFile });
});
