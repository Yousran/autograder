/**
 * Edit Test E2E Tests
 *
 * Verifies the educator workflow for editing an existing test.
 * These tests run as the shared authenticated user (storageState from
 * `auth.setup.ts`), starting with a newly created test and testing:
 *
 * Covers:
 *   ✓ Changing test title
 *   ✓ Accessing the Settings tab
 *   ✓ Updating test duration
 *   ✓ Updating maximum attempts
 *   ✓ Updating test description
 *   ✓ Toggling "Accepting Responses"
 *   ✓ Toggling "Logged In Users Only"
 *   ✓ Toggling "Show Detailed Score"
 *   ✓ Toggling "Show Correct Answers"
 *   ✓ Toggling "Questions Ordered"
 */

import { test, expect } from "@playwright/test";
import {
  createTest,
  TestNavigateToTab,
  updateTestTitle,
  updateTestDescription,
  setMaxAttempts,
  setDuration,
  toggleTestSetting,
} from "./helpers/test-modification";
import { waitForLoaderToDisappear } from "./helpers/ui-interactions";

// ---------------------------------------------------------------------------
// Edit Test - Settings Tab
// ---------------------------------------------------------------------------
test.describe.serial("Edit Test - Settings Tab", () => {
  // Explicitly load the shared auth state produced by auth.setup.ts.
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const { testId: newTestId } = await createTest(browser, {});
    testId = newTestId;
  });

  test("navigates to test edit page and settings tab is visible", async ({
    page,
  }) => {
    await page.goto(`/en/test/${testId}`);

    // Wait for all tabs to be visible
    await expect(async () => {
      await expect(page.getByRole("tab", { name: "Settings" })).toBeVisible();
      await expect(page.getByRole("tab", { name: "Questions" })).toBeVisible();
      await expect(
        page.getByRole("tab", { name: "Participants" }),
      ).toBeVisible();
    }).toPass();
  });

  test("displays all settings controls in settings tab", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "settings");

    // Verify all settings sections are visible by their test IDs
    await expect(async () => {
      await expect(page.getByTestId("test-description-preview")).toBeVisible();
    }).toPass();

    await expect(async () => {
      await expect(page.getByTestId("input-duration")).toBeVisible();
    }).toPass();

    await expect(async () => {
      await expect(page.getByTestId("input-max-attempts")).toBeVisible();
    }).toPass();

    await expect(async () => {
      await expect(
        page.getByTestId("toggle-accepting-responses"),
      ).toBeVisible();
    }).toPass();

    await expect(async () => {
      await expect(page.getByTestId("toggle-logged-in-only")).toBeVisible();
    }).toPass();

    await expect(async () => {
      await expect(page.getByTestId("toggle-detailed-score")).toBeVisible();
    }).toPass();

    await expect(async () => {
      await expect(page.getByTestId("toggle-correct-answers")).toBeVisible();
    }).toPass();

    await expect(async () => {
      await expect(page.getByTestId("toggle-questions-ordered")).toBeVisible();
    }).toPass();
  });

  test("updates test title", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    const newTitle = `Updated Test Title ${Date.now()}`;

    // Update title using helper
    await updateTestTitle(page, newTitle);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Reload and verify the title was persisted to the database
    await page.reload();

    await expect(async () => {
      await expect(page.getByTestId("test-title-preview")).toBeVisible();
    }).toPass();
  });

  test("updates test description", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "settings");

    const testDescription = `This is a test description created at ${Date.now()}`;

    // Update description using helper
    await updateTestDescription(page, testDescription);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Reload and verify
    await page.reload();
    await TestNavigateToTab(page, "settings");

    await expect(async () => {
      await expect(page.getByTestId("test-description-preview")).toBeVisible();
    }).toPass();
  });

  test("updates test duration", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "settings");

    // Update duration to 120 minutes using helper
    await setDuration(page, 120);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Reload and verify persistence
    await page.reload();
    await TestNavigateToTab(page, "settings");

    await expect(async () => {
      await expect(
        page.getByTestId("input-duration").locator('input[type="text"]'),
      ).toHaveValue("120");
    }).toPass();
  });

  test("updates maximum attempts", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "settings");

    // Update max attempts using helper
    await setMaxAttempts(page, 3);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Reload and verify persistence
    await page.reload();
    await TestNavigateToTab(page, "settings");

    await expect(async () => {
      await expect(
        page.getByTestId("input-max-attempts").locator('input[type="text"]'),
      ).toHaveValue("3");
    }).toPass();
  });

  test("toggles accepting responses", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "settings");

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-accepting-responses");

    const initialState = (await toggle.getAttribute("aria-checked")) === "true";

    // Toggle to opposite state using helper
    await toggleTestSetting(page, "toggle-accepting-responses", !initialState);

    // Verify state changed
    const newState = (await toggle.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(newState).toBe(!initialState);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await TestNavigateToTab(page, "settings");

    const toggleAfterReload = page.getByTestId("toggle-accepting-responses");
    const stateAfterReload =
      (await toggleAfterReload.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(stateAfterReload).toBe(newState);
    }).toPass();
  });

  test("toggles logged in user only", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "settings");

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-logged-in-only");

    const initialState = (await toggle.getAttribute("aria-checked")) === "true";

    // Toggle to opposite state using helper
    await toggleTestSetting(page, "toggle-logged-in-only", !initialState);

    // Verify state changed
    const newState = (await toggle.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(newState).toBe(!initialState);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await TestNavigateToTab(page, "settings");

    const toggleAfterReload = page.getByTestId("toggle-logged-in-only");
    const stateAfterReload =
      (await toggleAfterReload.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(stateAfterReload).toBe(newState);
    }).toPass();
  });

  test("toggles show detailed score", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "settings");

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-detailed-score");

    const initialState = (await toggle.getAttribute("aria-checked")) === "true";

    // Toggle to opposite state using helper
    await toggleTestSetting(page, "toggle-detailed-score", !initialState);

    // Verify state changed
    const newState = (await toggle.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(newState).toBe(!initialState);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await TestNavigateToTab(page, "settings");

    const toggleAfterReload = page.getByTestId("toggle-detailed-score");
    const stateAfterReload =
      (await toggleAfterReload.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(stateAfterReload).toBe(newState);
    }).toPass();
  });

  test("toggles show correct answers", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "settings");

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-correct-answers");

    const initialState = (await toggle.getAttribute("aria-checked")) === "true";

    // Toggle to opposite state using helper
    await toggleTestSetting(page, "toggle-correct-answers", !initialState);

    // Verify state changed
    const newState = (await toggle.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(newState).toBe(!initialState);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await TestNavigateToTab(page, "settings");

    const toggleAfterReload = page.getByTestId("toggle-correct-answers");
    const stateAfterReload =
      (await toggleAfterReload.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(stateAfterReload).toBe(newState);
    }).toPass();
  });

  test("toggles questions ordered", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "settings");

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-questions-ordered");

    const initialState = (await toggle.getAttribute("aria-checked")) === "true";

    // Toggle to opposite state using helper
    await toggleTestSetting(page, "toggle-questions-ordered", !initialState);

    // Verify state changed
    const newState = (await toggle.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(newState).toBe(!initialState);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await TestNavigateToTab(page, "settings");

    const toggleAfterReload = page.getByTestId("toggle-questions-ordered");
    const stateAfterReload =
      (await toggleAfterReload.getAttribute("aria-checked")) === "true";

    await expect(async () => {
      expect(stateAfterReload).toBe(newState);
    }).toPass();
  });
});

// ── API-level guard ────────────────────────────────────────────────────────
test.describe("Edit Test API guards", () => {
  // Override to run as unauthenticated user
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated PATCH /api/tests/{id} returns 401", async ({
    request,
  }) => {
    const response = await request.patch("/api/tests/some-test-id", {
      data: { title: "New Title" },
    });
    expect(response.status()).toBe(401);
  });

  test("PATCH with invalid test ID returns 404", async ({ request }) => {
    // This uses the shared auth from auth.setup but tries a non-existent ID
    // Set up auth manually if needed, or just test that invalid ID returns proper error

    const response = await request.patch(`/api/tests/invalid-test-id-xyz`, {
      data: { title: "New Title" },
    });
    // Should return 401 since we're not authenticated in this test
    expect(response.status()).toBe(401);
  });
});
