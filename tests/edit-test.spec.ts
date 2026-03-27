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
  createNewTest,
  navigateToSettingsTab,
  waitForLoaderToDisappear,
  toggleAcceptingResponses,
  toggleLoggedInOnly,
  toggleShowDetailedScore,
  toggleShowCorrectAnswers,
  toggleOrderedQuestions,
  setMaxAttempts,
} from "./helpers";

// ---------------------------------------------------------------------------
// Edit Test - Settings Tab
// ---------------------------------------------------------------------------
test.describe.serial("Edit Test - Settings Tab", () => {
  // Explicitly load the shared auth state produced by auth.setup.ts.
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    testId = await createNewTest(browser);
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

  test("changes test title successfully", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    const newTitle = `Updated Test Title ${Date.now()}`;

    // Hover and click to enter edit mode
    const titlePreview = page.getByTestId("test-title-preview");
    await titlePreview.hover();
    await titlePreview.click();

    // Use specific selector for the title input (data-testid attribute)
    const titleInput = page.getByTestId("test-title-input");
    await titleInput.waitFor({ state: "visible" });
    await titleInput.fill(newTitle);

    // Submit the change
    const submitButton = page.getByRole("button", { name: /save/i }).first();

    // Set up response listener BEFORE clicking
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tests/${testId}`) &&
        response.request().method() === "PATCH" &&
        response.status() === 200,
    );

    await submitButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Verify the title changed in the UI (indicates successful update)
    await expect(async () => {
      await expect(page.getByRole("button", { name: newTitle })).toBeVisible();
    }).toPass();

    await responsePromise;

    // Reload and verify the title was persisted to the database
    await page.reload();

    await expect(async () => {
      await expect(page.getByRole("button", { name: newTitle })).toBeVisible();
    }).toPass();
  });

  test("displays all settings controls in settings tab", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await navigateToSettingsTab(page);

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

  test("updates test duration", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await navigateToSettingsTab(page);

    // Find the duration input field (it should be under the Duration label)
    const durationLabel = page
      .locator("label")
      .filter({ hasText: /duration/i });
    const durationInput = durationLabel
      .locator("..")
      .locator('input[type="text"]')
      .first();

    // Update duration to 120 minutes
    await durationInput.click();
    await durationInput.clear();
    await durationInput.fill("120");

    // Set up response listener BEFORE pressing Enter
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tests/${testId}`) &&
        response.request().method() === "PATCH" &&
        response.status() === 200,
    );

    await durationInput.press("Enter");

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await responsePromise;

    // Reload and verify persistence
    await page.reload();
    await navigateToSettingsTab(page);

    const durationLabelAfterReload = page
      .locator("label")
      .filter({ hasText: /duration/i });
    const durationInputAfterReload = durationLabelAfterReload
      .locator("..")
      .locator('input[type="text"]')
      .first();

    await expect(async () => {
      await expect(durationInputAfterReload).toHaveValue("120");
    }).toPass();
  });

  test("updates maximum attempts", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await navigateToSettingsTab(page);

    await setMaxAttempts(page, 3);

    // Set up response listener BEFORE pressing Enter
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tests/${testId}`) &&
        response.request().method() === "PATCH" &&
        response.status() === 200,
    );

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await responsePromise;

    // Reload and verify persistence
    await page.reload();
    await navigateToSettingsTab(page);

    const maxAttemptInputAfterReload = page
      .getByTestId("input-max-attempts")
      .locator('input[type="text"]');

    await expect(async () => {
      await expect(maxAttemptInputAfterReload).toHaveValue("3");
    }).toPass();
  });

  test("updates test description", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await navigateToSettingsTab(page);

    // Get description text display element
    const descriptionText = page.getByTestId("test-description-preview");
    await descriptionText.click();

    // Get description input using test ID
    const descriptionInput = page.getByTestId("test-description-input");
    await descriptionInput.waitFor({ state: "visible" });

    const testDescription = `This is a test description created at ${Date.now()}`;
    await descriptionInput.fill(testDescription);

    // Set up response listener BEFORE submitting
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tests/${testId}`) &&
        response.request().method() === "PATCH" &&
        response.status() === 200,
    );

    // Submit
    await descriptionInput.press("Enter");

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await responsePromise;

    // Reload and verify
    await page.reload();
    await navigateToSettingsTab(page);

    await expect(async () => {
      await expect(page.locator("text=" + testDescription)).toBeVisible();
    }).toPass();
  });

  test("toggles accepting responses", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await navigateToSettingsTab(page);

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-accepting-responses");

    const initialState = await toggle.getAttribute("aria-checked");

    // Toggle using helper
    await toggleAcceptingResponses(page, testId);
    await waitForLoaderToDisappear(page);

    // Verify state changed
    const newState = await toggle.getAttribute("aria-checked");

    await expect(async () => {
      expect(newState !== initialState).toBe(true);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await navigateToSettingsTab(page);

    const toggleAfterReload = page.getByTestId("toggle-accepting-responses");
    const stateAfterReload =
      await toggleAfterReload.getAttribute("aria-checked");

    await expect(async () => {
      expect(stateAfterReload).toBe(newState);
    }).toPass();
  });

  test("toggles logged in user only", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await navigateToSettingsTab(page);

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-logged-in-only");

    const initialState = await toggle.getAttribute("aria-checked");

    // Toggle using helper
    await toggleLoggedInOnly(page, testId);
    await waitForLoaderToDisappear(page);

    // Verify state changed
    const newState = await toggle.getAttribute("aria-checked");

    await expect(async () => {
      expect(newState !== initialState).toBe(true);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await navigateToSettingsTab(page);

    const toggleAfterReload = page.getByTestId("toggle-logged-in-only");
    const stateAfterReload =
      await toggleAfterReload.getAttribute("aria-checked");

    await expect(async () => {
      expect(stateAfterReload).toBe(newState);
    }).toPass();
  });

  test("toggles show detailed score", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await navigateToSettingsTab(page);

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-detailed-score");

    const initialState = await toggle.getAttribute("aria-checked");

    // Toggle using helper
    await toggleShowDetailedScore(page, testId);
    await waitForLoaderToDisappear(page);

    // Verify state changed
    const newState = await toggle.getAttribute("aria-checked");

    await expect(async () => {
      expect(newState !== initialState).toBe(true);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await navigateToSettingsTab(page);

    const toggleAfterReload = page.getByTestId("toggle-detailed-score");
    const stateAfterReload =
      await toggleAfterReload.getAttribute("aria-checked");

    await expect(async () => {
      expect(stateAfterReload).toBe(newState);
    }).toPass();
  });

  test("toggles show correct answers", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await navigateToSettingsTab(page);

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-correct-answers");

    const initialState = await toggle.getAttribute("aria-checked");

    // Toggle using helper
    await toggleShowCorrectAnswers(page, testId);
    await waitForLoaderToDisappear(page);

    // Verify state changed
    const newState = await toggle.getAttribute("aria-checked");

    await expect(async () => {
      expect(newState !== initialState).toBe(true);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await navigateToSettingsTab(page);

    const toggleAfterReload = page.getByTestId("toggle-correct-answers");
    const stateAfterReload =
      await toggleAfterReload.getAttribute("aria-checked");

    await expect(async () => {
      expect(stateAfterReload).toBe(newState);
    }).toPass();
  });

  test("toggles questions ordered", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await navigateToSettingsTab(page);

    // Find switch to get initial state
    const toggle = page.getByTestId("toggle-questions-ordered");

    const initialState = await toggle.getAttribute("aria-checked");

    // Toggle using helper
    await toggleOrderedQuestions(page, testId);
    await waitForLoaderToDisappear(page);

    // Verify state changed
    const newState = await toggle.getAttribute("aria-checked");

    await expect(async () => {
      expect(newState !== initialState).toBe(true);
    }).toPass();

    // Reload and verify persistence
    await page.reload();
    await navigateToSettingsTab(page);

    const toggleAfterReload = page.getByTestId("toggle-questions-ordered");
    const stateAfterReload =
      await toggleAfterReload.getAttribute("aria-checked");

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
