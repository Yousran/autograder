/**
 * Join Test E2E Tests
 *
 * Verifies the participant workflow for joining a test from the home page.
 * Tests both authenticated users and guest participants with various test configurations.
 *
 * Covers:
 *   ✓ Join as authenticated user
 *   ✓ Join as guest with name
 *   ✓ Join fails when test not accepting responses
 *   ✓ Join fails when maximum attempts exceeded
 *   ✓ Join fails when prerequisite not met
 *   ✓ Join fails when test requires logged in users only
 *   ✓ API authentication guard
 */
// TODO: Test Prerequisite check

import { test, expect, Page } from "@playwright/test";
import { waitForLoaderToDisappear } from "./helpers";

const BASE_URL = "http://localhost:3000";

// ─────────────────────────────────────────────────────────────────────────
// Utility: Create a test with a question and customize settings
// ─────────────────────────────────────────────────────────────────────────

async function createTestWithQuestion(
  page: Page,
  {
    title = "Test to Join",
    acceptingResponses = true,
    maxAttempts = null,
    loggedInOnly = false,
    description = "A test for joining",
  }: {
    title?: string;
    acceptingResponses?: boolean;
    maxAttempts?: number | null;
    loggedInOnly?: boolean;
    description?: string;
  } = {},
): Promise<string> {
  // Navigate to home and create test
  await page.goto(`${BASE_URL}/en`);

  const createButton = page.getByRole("button", { name: "Create New Test" });
  await createButton.waitFor({ state: "visible" });
  await createButton.click();

  // Wait for the test editor to load
  await page.waitForURL(/\/en\/test\/[a-z0-9]+/i);

  const url = page.url();
  const testIdMatch = url.match(/test\/([a-z0-9]+)/i);
  const testId = testIdMatch ? testIdMatch[1] : null;

  // Update test title
  const titleElement = page.locator("text=/Untitled Test/");
  await titleElement.first().hover();
  await titleElement.first().click();

  const titleInput = page.locator('input[data-slot="editable-input"]');
  await titleInput.waitFor({ state: "visible" });
  await titleInput.fill(title);
  await titleInput.press("Enter");

  // Wait for update to complete
  await page.waitForResponse(
    (response) =>
      response.url().includes(`/api/tests/${testId}`) &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );

  // Go to Settings tab and update configuration
  const settingsTab = page.getByRole("tab", { name: "Settings" });
  await settingsTab.waitFor({ state: "visible" });
  await settingsTab.click();
  await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

  // Find the description input/textarea
  const descriptionLabel = page
    .locator("label")
    .filter({ hasText: /description/i });
  const descriptionContainer = descriptionLabel.locator("..");
  // Click to enter edit mode
  const descriptionText = descriptionContainer.locator("p, div").first();
  await descriptionText.click();
  // Wait for textarea or input to appear
  const descriptionInput = descriptionContainer
    .locator("textarea, input")
    .first();
  await descriptionInput.waitFor({ state: "visible" });

  await descriptionInput.fill(description);
  await descriptionInput.press("Enter");

  // Update accepting responses toggle
  if (!acceptingResponses) {
    const toggle = page
      .getByText("Accepting Responses", { exact: false })
      .locator("..")
      .locator("..")
      .getByRole("switch");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tests/${testId}`) &&
        response.request().method() === "PATCH" &&
        response.status() === 200,
    );

    // Click to toggle
    await toggle.click();

    await responsePromise;
  }

  // Update logged in user only toggle
  if (loggedInOnly) {
    // Find switch by navigating from the label text to the parent container
    const toggle = page
      .getByText("Logged-in Users Only", { exact: false })
      .locator("..")
      .locator("..")
      .getByRole("switch");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/api/tests/${testId}`) &&
        response.request().method() === "PATCH" &&
        response.status() === 200,
    );

    // Click to toggle
    await toggle.click();

    await responsePromise;
  }

  // Update max attempts if specified
  if (maxAttempts !== null) {
    const maxAttemptLabel = page
      .locator("label")
      .filter({ hasText: /max.*attempt/i });
    const maxAttemptInput = maxAttemptLabel
      .locator("..")
      .locator("input")
      .first();

    await maxAttemptInput.click();
    await maxAttemptInput.clear();
    await maxAttemptInput.fill(maxAttempts.toString());
    await maxAttemptInput.press("Enter");
  }

  // Create a question
  const questionsTab = page.getByRole("tab", { name: "Questions" });
  await questionsTab.waitFor({ state: "visible" });
  await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
  await questionsTab.click();

  // Wait for the tabpanel content to be visible (confirms tab switch)
  await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

  // Initially there should be no questions, so only one "Add Question" button at bottom
  const addQuestionButtons = page.getByRole("button", {
    name: /add question/i,
  });
  await expect(async () => {
    await expect(addQuestionButtons).toHaveCount(1);
  }).toPass();

  // Click the "Add Question" button (visible at the end when no questions exist)
  await addQuestionButtons.nth(0).click();

  // The question should be optimistically added

  // Verify question card appears with default props
  const questionCard = page.locator('[class*="shadow"]').filter({
    has: page.getByText(/question text/i),
  });
  await expect(async () => {
    await expect(questionCard).toBeVisible();
  }).toPass();

  const joinCodeElement = page
    .locator("label")
    .filter({ hasText: /[A-Z0-9]{6}/ })
    .first();
  await expect(async () => {
    await expect(joinCodeElement).toBeVisible();
  }).toPass();
  const joinCode = await joinCodeElement.textContent();

  return joinCode || "";
}

// ─────────────────────────────────────────────────────────────────────────
// Utility: Complete a test by finding and clicking finish button
// ─────────────────────────────────────────────────────────────────────────

async function completeTest(page: Page) {
  // Wait for test page to load and find finish button
  const finishButton = page.getByRole("button", { name: "Finish" });
  await expect(async () => {
    await expect(finishButton).toBeVisible();
  }).toPass();
  await finishButton.click();
}

// ─────────────────────────────────────────────────────────────────────────
// Join as Authenticated User
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Join Test - Authenticated User", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create test as authenticated user
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      const newJoinCode = await createTestWithQuestion(page, {
        title: "Test to Join as User",
      });
      joinCode = newJoinCode;

      await context.close();
    }).toPass();
  });

  test("home page shows join code input field when unauthenticated context present", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en`);

    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();
  });

  test("successfully joins test with valid join code as authenticated user", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en`);

    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    const joinCodeInput = page.getByRole("textbox");
    const joinButton = page.getByRole("button", { name: /join/i });
    await joinCodeInput.fill(joinCode);
    await expect(joinButton).toBeEnabled();
    await joinButton.click();
    await page.waitForURL(`${BASE_URL}/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();

    await startButton.click();

    const userConfirm = page.getByText("Your name is taken from your");
    await expect(userConfirm).toBeVisible();
    const confirmButton = page.getByRole("button", { name: "Join & Start" });
    await expect(confirmButton).toBeVisible();

    await confirmButton.click();
    await page.waitForURL(`${BASE_URL}/en/test/start/*`);

    await completeTest(page);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Join as Guest
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Join Test - Guest User", () => {
  // Guest = unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });

  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create test as authenticated user
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      const newJoinCode = await createTestWithQuestion(page, {
        title: "Test to Join as Guest",
      });
      joinCode = newJoinCode;

      await context.close();
    }).toPass();
  });

  test("shows home page with join code input for guest users", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();
  });

  test("guest joins test with valid join code and provides name", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    const joinCodeInput = page.getByRole("textbox");
    const joinButton = page.getByRole("button", { name: /join/i });
    await joinCodeInput.fill(joinCode);
    await expect(joinButton).toBeEnabled();
    await joinButton.click();
    await page.waitForURL(`${BASE_URL}/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();

    await startButton.click();

    const guestConfirm = page.getByRole("textbox", { name: "Your Name" });
    await expect(async () => {
      await expect(guestConfirm).toBeVisible();
    }).toPass();
    const confirmButton = page.getByRole("button", { name: "Join & Start" });
    await expect(confirmButton).toBeVisible();

    await guestConfirm.fill("Guest Participant");
    await confirmButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`${BASE_URL}/en/test/start/*`);

    await completeTest(page);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Join - Handle Constraint: Not Accepting Responses
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Join Test - Not Accepting Responses", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create test that does NOT accept responses
      const creatorContext = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const creatorPage = await creatorContext.newPage();

      const newJoinCode = await createTestWithQuestion(creatorPage, {
        title: "Closed Test",
        acceptingResponses: false,
      });
      joinCode = newJoinCode;

      await creatorContext.close();
    }).toPass();
  });

  test("join fails when test is not accepting responses", async ({ page }) => {
    await page.goto(`${BASE_URL}/en`);

    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    const joinCodeInput = page.getByRole("textbox");
    const joinButton = page.getByRole("button", { name: /join/i });
    await joinCodeInput.fill(joinCode);
    await expect(joinButton).toBeEnabled();
    await joinButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`${BASE_URL}/en/join/${joinCode}`);

    const notAcceptingMessage = page.getByText(
      "This test is not currently accepting responses",
    );
    await expect(async () => {
      await expect(notAcceptingMessage).toBeVisible();
    }).toPass();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Join - Handle Constraint: Max Attempts Exceeded
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Join Test - Max Attempts Exceeded", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create test with max 1 attempt
      const creatorContext = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const creatorPage = await creatorContext.newPage();

      const newJoinCode = await createTestWithQuestion(creatorPage, {
        title: "Max Attempts Test",
        maxAttempts: 1,
      });
      joinCode = newJoinCode;

      await creatorContext.close();
    }).toPass();
  });

  test("join fails when participant has reached max attempts", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    const joinCodeInput = page.getByRole("textbox");
    const joinButton = page.getByRole("button", { name: /join/i });

    // First attempt - should succeed
    await joinCodeInput.fill(joinCode);
    await expect(joinButton).toBeEnabled();
    await joinButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`${BASE_URL}/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();

    await startButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    const userConfirm = page.getByText("Your name is taken from your");
    await expect(userConfirm).toBeVisible();
    const confirmButton = page.getByRole("button", { name: "Join & Start" });
    await expect(confirmButton).toBeVisible();

    await confirmButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`${BASE_URL}/en/test/start/*`);

    // Complete the test (first attempt)
    await completeTest(page);

    // Second attempt - should fail with max attempts message
    await page.goto(`${BASE_URL}/en`);
    const joinCodeInput2 = page.getByRole("textbox");
    await expect(async () => {
      await expect(joinCodeInput2).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    const joinButton2 = page.getByRole("button", { name: /join/i });

    await joinCodeInput2.fill(joinCode);
    await expect(joinButton2).toBeEnabled();
    await joinButton2.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`${BASE_URL}/en/join/${joinCode}`);

    const startButton2 = page.getByRole("button", { name: "Start Test" });
    await expect(startButton2).toBeVisible();

    await startButton2.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Wait for the dialog to open and find the confirm button
    const confirmButton2 = page.getByRole("button", { name: "Join & Start" });
    await expect(confirmButton2).toBeVisible();

    // Click to submit the join request - this should fail with max attempts error
    await confirmButton2.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Should see the max attempts error message in the dialog
    const maxAttemptsMessage = page.getByText(
      "You have reached the maximum number of attempts for this test",
    );
    await expect(async () => {
      await expect(maxAttemptsMessage).toBeVisible();
    }).toPass();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Join - Handle Constraint: Logged In Users Only
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Join Test - Logged In Users Only", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create test that does NOT accept responses
      const creatorContext = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const creatorPage = await creatorContext.newPage();

      const newJoinCode = await createTestWithQuestion(creatorPage, {
        title: "Closed Test",
        loggedInOnly: true,
      });
      joinCode = newJoinCode;

      await creatorContext.close();
    }).toPass();
  });

  test("guest cannot join test that requires logged in users", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    const joinCodeInput = page.getByRole("textbox");
    const joinButton = page.getByRole("button", { name: /join/i });
    await joinCodeInput.fill(joinCode);
    await joinButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`${BASE_URL}/en/join/${joinCode}`);

    const loggedInOnlyMessage = page.getByText(
      "This test requires you to be signed in",
    );
    await expect(async () => {
      await expect(loggedInOnlyMessage).toBeVisible();
    }).toPass();
  });

  test("authenticated user can join test that requires logged in users", async ({
    browser,
  }) => {
    const creatorContext = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const creatorPage = await creatorContext.newPage();
    await creatorPage.goto(`${BASE_URL}/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(creatorPage.getByRole("textbox")).toBeVisible();
      await expect(
        creatorPage.getByRole("button", { name: /join/i }),
      ).toBeVisible();
    }).toPass();

    const joinCodeInput = creatorPage.getByRole("textbox");
    const joinButton = creatorPage.getByRole("button", { name: /join/i });
    await joinCodeInput.fill(joinCode);
    await joinButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(creatorPage);

    await creatorPage.waitForURL(`${BASE_URL}/en/join/${joinCode}`);

    const startButton = creatorPage.getByRole("button", { name: "Start Test" });
    await expect(async () => {
      await expect(startButton).toBeVisible();
    }).toPass();
    await creatorContext.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// API-level guards - Unauthenticated
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Join Test - API Guards (Unauthenticated)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  let guestAllowedJoinCode: string;
  let loggedInRequiredJoinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create tests for API guard testing as authenticated creator
      const creatorContext = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const creatorPage = await creatorContext.newPage();

      const guestCode = await createTestWithQuestion(creatorPage, {
        title: "API Join Test - Guests Allowed",
        loggedInOnly: false,
      });
      guestAllowedJoinCode = guestCode;

      const loggedInCode = await createTestWithQuestion(creatorPage, {
        title: "Logged In Required Test API",
        loggedInOnly: true,
      });
      loggedInRequiredJoinCode = loggedInCode;

      await creatorContext.close();
    }).toPass();
  });

  test("unauthenticated user can join via API if test allows guests", async ({
    request,
  }) => {
    // Try to join via API as unauthenticated user
    const response = await request.post(`/api/tests/join`, {
      data: {
        joinCode: guestAllowedJoinCode,
        name: "Guest API User",
      },
    });

    // Should succeed (200 or 201)
    expect([200, 201]).toContain(response.status());

    // Verify response structure
    const responseData = await response.json();
    expect(responseData).toHaveProperty("participantId");
    expect(responseData).toHaveProperty("testId");
  });

  test("unauthenticated user cannot join test requiring logged in users", async ({
    request,
  }) => {
    // Try to join via API as unauthenticated
    const response = await request.post(`/api/tests/join`, {
      data: {
        joinCode: loggedInRequiredJoinCode,
        name: "Guest API User",
      },
    });

    // Should fail with 401 (not authenticated)
    expect(response.status()).toBe(401);

    // Verify error message
    const responseBody = await response.text();
    expect(responseBody.toLowerCase()).toMatch(/logged|authenticate|sign/);
  });

  test("join fails for non-existent join code", async ({ request }) => {
    const response = await request.post(`/api/tests/join`, {
      data: {
        joinCode: "XXXXXX",
        name: "Guest API User",
      },
    });

    expect(response.status()).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// API-level guards - Authenticated
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Join Test - API Guards (Authenticated)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  let guestAllowedJoinCode: string;
  let loggedInRequiredJoinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create tests for API guard testing as authenticated creator
      const creatorContext = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const creatorPage = await creatorContext.newPage();

      const guestCode = await createTestWithQuestion(creatorPage, {
        title: "API Join Test - Auth Guest Allowed",
        loggedInOnly: false,
      });
      guestAllowedJoinCode = guestCode;

      const loggedInCode = await createTestWithQuestion(creatorPage, {
        title: "Logged In Required Test - Auth User",
        loggedInOnly: true,
      });
      loggedInRequiredJoinCode = loggedInCode;

      await creatorContext.close();
    }).toPass();
  });

  test("authenticated user can join test allowing guests", async ({
    request,
  }) => {
    const response = await request.post(`/api/tests/join`, {
      data: {
        joinCode: guestAllowedJoinCode,
        name: "Authenticated User",
      },
    });

    // Should succeed (200 or 201)
    expect([200, 201]).toContain(response.status());

    // Verify response structure
    const responseData = await response.json();
    expect(responseData).toHaveProperty("participantId");
    expect(responseData).toHaveProperty("testId");
  });

  test("authenticated user can join test requiring logged in users", async ({
    request,
  }) => {
    const response = await request.post(`/api/tests/join`, {
      data: {
        joinCode: loggedInRequiredJoinCode,
        name: "Authenticated User",
      },
    });

    // Should succeed (200 or 201)
    expect([200, 201]).toContain(response.status());

    // Verify response structure
    const responseData = await response.json();
    expect(responseData).toHaveProperty("participantId");
    expect(responseData).toHaveProperty("testId");
  });
});
