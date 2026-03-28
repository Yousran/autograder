/**
 * Create Test E2E Tests
 *
 * Verifies the educator workflow for creating a new test from the home page.
 * These tests run as the shared authenticated user (storageState from
 * `auth.setup.ts`), so the "Create New Test" button is visible.
 *
 * Covers:
 *   ✓ Clicking "Create New Test" navigates to the test editor
 *   ✓ Test editor page loads with the default title "Untitled Test"
 *   ✓ Unauthenticated users cannot access the create endpoint (401)
 */

import { test, expect } from "@playwright/test";
import { waitForLoaderToDisappear } from "./helpers/ui-interactions";

// The storageState is already set globally from the setup project for all
// projects defined in playwright.config.ts.  No override is needed here.

test.describe("Create Test", () => {
  test("home page shows the Create New Test button when authenticated", async ({
    page,
  }) => {
    await page.goto("/en");

    // The button is conditionally rendered only for signed-in users.
    await expect(async () => {
      await expect(
        page.getByRole("button", { name: "Create New Test" }),
      ).toBeVisible();
    }).toPass();
  });

  test("clicking Create New Test navigates to the test editor", async ({
    page,
  }) => {
    await page.goto("/en");

    await page.getByRole("button", { name: "Create New Test" }).click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // The API call creates a test and the router redirects to /test/{id}.
    // Wait for the URL to match the test editor pattern.
    await expect(async () => {
      await expect(page).toHaveURL(/\/en\/test\/[a-z0-9]+/i);
    }).toPass();
  });

  test("test editor page shows the default Untitled Test title", async ({
    page,
  }) => {
    await page.goto("/en");

    await page.getByRole("button", { name: "Create New Test" }).click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(/\/en\/test\/[a-z0-9]+/i);

    // The TestTitleEditable component renders the editable preview with the
    // default title "Untitled Test".
    await expect(async () => {
      await expect(page.getByText("Untitled Test")).toBeVisible();
    }).toPass();
  });

  test("test editor page has Settings, Questions and Participants tabs", async ({
    page,
  }) => {
    await page.goto("/en");

    await page.getByRole("button", { name: "Create New Test" }).click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(/\/en\/test\/[a-z0-9]+/i);

    // Verify the key tabs that educators use to manage their test.
    await expect(async () => {
      await expect(page.getByRole("tab", { name: "Settings" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Questions" })).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Participants" }),
      ).toBeVisible();
    }).toPass();
  });
});

// ── API-level guard ────────────────────────────────────────────────────────

test.describe("Create Test API guard", () => {
  // Override the authenticated state to test as an anonymous user.
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated POST /api/tests/create returns 401", async ({
    request,
  }) => {
    const response = await request.post("/api/tests/create");
    expect(response.status()).toBe(401);
  });
});
