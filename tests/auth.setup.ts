/**
 * Auth Setup
 *
 * Runs once before all test projects (see playwright.config.ts `setup` project).
 * Authenticates the shared test account and saves the browser storage state so
 * subsequent tests can start already signed-in without repeating the login flow.
 *
 * Required environment variables (fall back to sensible test defaults):
 *   TEST_USER_NAME     – display name for the account  (default: "Test User")
 *   TEST_USER_EMAIL    – email for the test account    (default: "testuser@playwright.local")
 *   TEST_USER_PASSWORD – password for the test account (default: "Playwright@123")
 *
 * On the very first run the account may not exist yet.  The setup will attempt
 * to sign in; if that fails it creates the account via the sign-up form and
 * then signs in again so the storage state always reflects a valid session.
 */

import { test as setup, expect } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, "../playwright/.auth/user.json");

const TEST_NAME = process.env.TEST_USER_NAME ?? "Test User";
const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? "testuser@playwright.local";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? "Playwright@123";

setup("authenticate", async ({ page }) => {
  // ── Step 1: attempt sign-in ──────────────────────────────────────────────
  await page.goto("/en/auth/sign-in");
  await expect(page).toHaveURL(/\/en\/auth\/sign-in/);

  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  // Give up to 6 s for either a successful redirect or an error paragraph.
  const signedIn = await Promise.race([
    page
      .waitForURL(/\/en\/?$/, { timeout: 6_000 })
      .then(() => true)
      .catch(() => false),
    page
      .locator("p.text-destructive")
      .waitFor({ state: "visible", timeout: 6_000 })
      .then(() => false)
      .catch(() => false),
  ]);

  // ── Step 2: if sign-in failed, create the account first ─────────────────
  if (!signedIn) {
    await page.goto("/en/auth/sign-up");
    await expect(page).toHaveURL(/\/en\/auth\/sign-up/);

    await page.getByLabel("Full Name").fill(TEST_NAME);
    await page.getByLabel("Email").fill(TEST_EMAIL);
    // Both password fields share the same label text; use nth() to distinguish.
    const passwordFields = page.getByLabel("Password");
    await passwordFields.nth(0).fill(TEST_PASSWORD);
    await page.getByLabel("Confirm Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign Up" }).click();

    // Wait for the post-signup redirect to the home page.
    await page.waitForURL(/\/en\/?$/, { timeout: 10_000 });
  }

  // ── Step 3: assert we are on the home page ───────────────────────────────
  await expect(page).toHaveURL(/\/en\/?$/);

  // ── Step 4: persist the authenticated context ────────────────────────────
  await page.context().storageState({ path: AUTH_FILE });
});
