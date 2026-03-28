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

import { test, expect } from "@playwright/test";
import { createTest } from "./helpers/test-modification";
import { submitJoinCode, completeTest } from "./helpers/test-start";
import { waitForLoaderToDisappear } from "./helpers/ui-interactions";

// ─────────────────────────────────────────────────────────────────────────
// Utility: Create a test with a question and customize settings
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// Join as Authenticated User
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Join Test - Authenticated User", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const result = await createTest(browser, {
        title: "Test to Join as User",
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      joinCode = result.joinCode;
    }).toPass();
  });

  test("home page shows join code input field when unauthenticated context present", async ({
    page,
  }) => {
    await page.goto(`/en`);

    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();
  });

  test("successfully joins test with valid join code as authenticated user", async ({
    page,
  }) => {
    await page.goto(`/en`);

    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();

    await startButton.click();

    const userConfirm = page.getByText("Your name is taken from your");
    await expect(userConfirm).toBeVisible();
    const confirmButton = page.getByRole("button", { name: "Join & Start" });
    await expect(confirmButton).toBeVisible();

    await confirmButton.click();
    await page.waitForURL(`/en/test/start/*`);

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
      const result = await createTest(browser, {
        title: "Test to Join as Guest",
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      joinCode = result.joinCode;
    }).toPass();
  });

  test("shows home page with join code input for guest users", async ({
    page,
  }) => {
    await page.goto(`/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();
  });

  test("guest joins test with valid join code and provides name", async ({
    page,
  }) => {
    await page.goto(`/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();

    await startButton.click();

    const guestConfirm = page.getByTestId("input-participant-name");
    await expect(async () => {
      await expect(guestConfirm).toBeVisible();
    }).toPass();
    const confirmButton = page.getByRole("button", { name: "Join & Start" });
    await expect(confirmButton).toBeVisible();

    await guestConfirm.fill("Guest Participant");
    await confirmButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`/en/test/start/*`);

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
      const result = await createTest(browser, {
        title: "Closed Test",
        acceptingResponses: false,
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      joinCode = result.joinCode;
    }).toPass();
  });

  test("join fails when test is not accepting responses", async ({ page }) => {
    await page.goto(`/en`);

    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    await submitJoinCode(page, joinCode);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`/en/join/${joinCode}`);

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
      const result = await createTest(browser, {
        title: "Max Attempts Test",
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      joinCode = result.joinCode;
    }).toPass();
  });

  test("join fails when participant has reached max attempts", async ({
    page,
  }) => {
    await page.goto(`/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    await submitJoinCode(page, joinCode);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`/en/join/${joinCode}`);

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

    await page.waitForURL(`/en/test/start/*`);

    // Complete the test (first attempt)
    await completeTest(page);

    // Second attempt - should fail with max attempts message
    await page.goto(`/en`);
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    await submitJoinCode(page, joinCode);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`/en/join/${joinCode}`);

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
      const result = await createTest(browser, {
        title: "Closed Test",
        loggedInOnly: true,
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      joinCode = result.joinCode;
    }).toPass();
  });

  test("guest cannot join test that requires logged in users", async ({
    page,
  }) => {
    await page.goto(`/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(page.getByRole("textbox")).toBeVisible();
      await expect(page.getByRole("button", { name: /join/i })).toBeVisible();
    }).toPass();

    await submitJoinCode(page, joinCode);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL(`/en/join/${joinCode}`);

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
    await creatorPage.goto(`/en`);
    // Verify join code input and button are visible
    await expect(async () => {
      await expect(creatorPage.getByRole("textbox")).toBeVisible();
      await expect(
        creatorPage.getByRole("button", { name: /join/i }),
      ).toBeVisible();
    }).toPass();

    await submitJoinCode(creatorPage, joinCode);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(creatorPage);

    await creatorPage.waitForURL(`/en/join/${joinCode}`);

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
      const guestResult = await createTest(browser, {
        title: "API Join Test - Guests Allowed",
        loggedInOnly: false,
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      guestAllowedJoinCode = guestResult.joinCode;

      const loggedInResult = await createTest(browser, {
        title: "Logged In Required Test API",
        loggedInOnly: true,
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      loggedInRequiredJoinCode = loggedInResult.joinCode;
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
      const guestResult = await createTest(browser, {
        title: "API Join Test - Auth Guest Allowed",
        loggedInOnly: false,
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      guestAllowedJoinCode = guestResult.joinCode;

      const loggedInResult = await createTest(browser, {
        title: "Logged In Required Test - Auth User",
        loggedInOnly: true,
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      loggedInRequiredJoinCode = loggedInResult.joinCode;
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
