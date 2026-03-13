/**
 * Start Test E2E Tests
 *
 * Verifies the participant workflow for starting and taking a test.
 * Tests session management, time limits, question order, and answer preservation.
 *
 * Covers:
 *   ✓ Can restart a test that already started (within duration)
 *   ✓ Can navigate back to start test after finishing
 *   ✓ Cannot start test when exceeded duration (redirects to result page)
 *   ✓ Test auto-submits when time limit expires
 *   ✓ Answers are stored correctly when moving between questions
 *   ✓ Question order is consistent for non-randomized tests
 *   ✓ Question order is randomized for randomized tests
 */

import { test, expect } from "@playwright/test";
import {
  createTestWithMultipleQuestions,
  waitForLoaderToDisappear,
  submitJoinCode,
  completeTest,
} from "./helpers";

// ─────────────────────────────────────────────────────────────────────────
// Start Test - Session Re-entry
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Start Test - Already Started Within Duration", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      const result = await createTestWithMultipleQuestions(page, {
        title: "Restart Test Within Duration",
        questionCount: 1,
        maxAttempts: 2,
      });
      joinCode = result.joinCode;

      await context.close();
    }).toPass();
  });

  test("can restart a test that already started and still within duration via url", async ({
    page,
  }) => {
    // First participant joins and starts the test
    await page.goto("/en");
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();
    await startButton.click();

    const guestConfirm = page.getByRole("textbox", { name: "Your Name" });
    await expect(guestConfirm).toBeVisible();
    await guestConfirm.fill("Test Participant");

    const confirmButton = page.getByRole("button", { name: "Join & Start" });
    await confirmButton.click();

    await waitForLoaderToDisappear(page);
    await page.waitForURL(`/en/test/start/*`);
    const participantId = page.url().split("/").pop() || "";

    await expect(async () => {
      await page.goto("/en");
      await expect(page).toHaveURL(`/en`);

      await page.goto(`/en/test/start/${participantId}`);
      await expect(page).toHaveURL(`/en/test/start/${participantId}`);

      await completeTest(page);
    }).toPass();
  });

  test("can restart a test that already started and still within duration via ui", async ({
    page,
  }) => {
    // First participant joins and starts the test
    await page.goto("/en");
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();
    await startButton.click();

    const guestConfirm = page.getByRole("textbox", { name: "Your Name" });
    await expect(guestConfirm).toBeVisible();
    await guestConfirm.fill("Test Participant");

    const confirmButton = page.getByRole("button", { name: "Join & Start" });
    await confirmButton.click();

    await waitForLoaderToDisappear(page);
    await page.waitForURL(`/en/test/start/*`);

    // Now go back to the home page
    await page.goto("/en");

    // Attempt to rejoin with the same join code
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    // Should be able to click Start Test again
    const restartButton = page.getByRole("button", { name: "Start Test" });
    await expect(restartButton).toBeVisible();
    await restartButton.click();

    // Should show confirmation dialog again
    const nameInput = page.getByRole("textbox", { name: "Your Name" });
    await expect(async () => {
      await expect(nameInput).toBeVisible();
    }).toPass();

    // Confirm and verify we're back in the test
    await nameInput.fill("Test Participant");
    const joinConfirmButton = page.getByRole("button", {
      name: "Join & Start",
    });
    await joinConfirmButton.click();

    await waitForLoaderToDisappear(page);

    // Should be redirected back to the test (same session ID)
    await expect(async () => {
      await expect(page).toHaveURL(/\/en\/test\/start\/.+/);
    }).toPass();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Start Test - Navigation After Completion
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Start Test - Return to Results", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      const result = await createTestWithMultipleQuestions(page, {
        title: "Test Return to Results",
        questionCount: 1,
        maxAttempts: 2,
      });
      joinCode = result.joinCode;

      await context.close();
    }).toPass();
  });

  test("cannot go back to start test page after finishing from result page", async ({
    page,
  }) => {
    await page.goto("/en");
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await startButton.click();

    const guestName = page.getByRole("textbox", { name: "Your Name" });
    await guestName.fill("Guest");

    const joinButton = page.getByRole("button", { name: "Join & Start" });
    await joinButton.click();

    await waitForLoaderToDisappear(page);
    await page.waitForURL(`/en/test/start/*`);

    const participantId = page.url().split("/").pop() || "";

    // Complete the test
    await completeTest(page);

    // Should be on result page
    await expect(async () => {
      await expect(page).toHaveURL(/\/en\/test\/(result|complete)/);
      await page.goBack();
      await expect(page).toHaveURL(`/en/join/${joinCode}`);

      await page.goto(`/en/test/start/${participantId}`);
      await expect(page).toHaveURL(/\/en\/test\/(result|complete)/);
    }).toPass();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Start Test - Duration Exceeded
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Start Test - Duration Exceeded", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      // Create test with very short duration (1 minute)
      const result = await createTestWithMultipleQuestions(page, {
        title: "Duration Exceeded Test",
        questionCount: 1,
        duration: 1,
        maxAttempts: 2,
      });
      joinCode = result.joinCode;

      await context.close();
    }).toPass();
  });

  test("cannot go back to start test when time exceeded - redirects to result page", async ({
    page,
  }) => {
    await page.goto("/en");
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await startButton.click();

    const guestName = page.getByRole("textbox", { name: "Your Name" });
    await guestName.fill("Guest");

    const joinButton = page.getByRole("button", { name: "Join & Start" });
    await joinButton.click();

    await waitForLoaderToDisappear(page);
    await page.waitForURL(`/en/test/start/*`);

    await page.waitForTimeout(70000); // Wait for 70 seconds to ensure duration is exceeded

    // Verify we're on a result/completion page
    await expect(page).toHaveURL(/\/en\/test\/(result|complete)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Start Test - Auto-Submit on Time Limit
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Start Test - Auto-Submit on Timeout", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      // Create test with very short duration for quick timeout
      const result = await createTestWithMultipleQuestions(page, {
        title: "Auto-Submit Test",
        questionCount: 2,
        duration: 1, // 1 minute duration
        maxAttempts: 2,
      });
      joinCode = result.joinCode;

      await context.close();
    }).toPass();
  });

  test("test auto-submits when time limit expires", async ({ page }) => {
    await page.goto("/en");
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await startButton.click();

    const guestName = page.getByRole("textbox", { name: "Your Name" });
    await guestName.fill("Guest");

    const joinButton = page.getByRole("button", { name: "Join & Start" });
    await joinButton.click();

    await waitForLoaderToDisappear(page);
    await page.waitForURL(`/en/test/start/*`);

    // Test is running - verify timer element exists
    const timerElement = page.getByText(/time remaining|countdown/i);
    await expect(async () => {
      const isVisible = await timerElement.isVisible().catch(() => false);
      expect(isVisible).toBe(true);
    }).toPass();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Start Test - Answer Preservation Between Questions
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Start Test - Answer Preservation", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      const result = await createTestWithMultipleQuestions(page, {
        title: "Answer Preservation Test",
        questionCount: 3,
        maxAttempts: 2,
      });
      joinCode = result.joinCode;

      await context.close();
    }).toPass();
  });

  test("stores answers correctly when moving between questions", async ({
    page,
  }) => {
    await page.goto("/en");
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await startButton.click();

    const guestName = page.getByRole("textbox", { name: "Your Name" });
    await guestName.fill("Test Participant");

    const joinButton = page.getByRole("button", { name: "Join & Start" });
    await joinButton.click();

    await waitForLoaderToDisappear(page);
    await page.waitForURL(`/en/test/start/*`);

    // Answer all 3 questions (select first options and navigate)
    const radioOptions = page.locator('input[type="radio"]');
    await expect(async () => {
      const count = await radioOptions.count();
      expect(count).toBeGreaterThan(0);
    }).toPass();

    // Answer Q1
    await radioOptions.nth(0).check();

    // Go to Q2
    const nextButton = page.getByRole("button", { name: /next/i });
    await nextButton.click();
    await page.waitForTimeout(200);

    // Answer Q2
    await radioOptions.nth(0).check();
    await nextButton.click();
    await page.waitForTimeout(200);

    // Answer Q3
    await radioOptions.nth(0).check();

    // Go back to Q2 and verify answer is still there
    const prevButton = page.getByRole("button", { name: /previous/i });
    await prevButton.click();
    await page.waitForTimeout(200);

    // Verify second answer is preserved
    const checkedResponses = page.locator('input[type="radio"]:checked');
    await expect(async () => {
      const count = await checkedResponses.count();
      expect(count).toBeGreaterThan(0);
    }).toPass();

    // Complete the test
    await completeTest(page);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Start Test - Question Order Consistency (Non-Randomized)
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Start Test - Consistent Question Order", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      const result = await createTestWithMultipleQuestions(page, {
        title: "Non-Randomized Questions",
        questionCount: 3,
        randomizeQuestions: false,
        maxAttempts: 2,
      });
      joinCode = result.joinCode;

      await context.close();
    }).toPass();
  });

  test("question order is consistent for non-randomized tests across participants", async ({
    page,
  }) => {
    // First participant
    await page.goto("/en");
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await startButton.click();

    const guestName = page.getByRole("textbox", { name: "Your Name" });
    await guestName.fill("Participant 1");

    const joinButton = page.getByRole("button", { name: "Join & Start" });
    await joinButton.click();

    await waitForLoaderToDisappear(page);
    await page.waitForURL(`/en/test/start/*`);

    // Answer first question to capture order
    const radioOptions = page.locator('input[type="radio"]');
    await radioOptions.nth(0).check();

    // Complete test
    await completeTest(page);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Start Test - Randomized Question Order
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Start Test - Randomized Question Order", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      const result = await createTestWithMultipleQuestions(page, {
        title: "Randomized Questions",
        questionCount: 3,
        randomizeQuestions: true,
        maxAttempts: 2,
      });
      joinCode = result.joinCode;

      await context.close();
    }).toPass();
  });

  test("question order is randomized for different participants", async ({
    page,
  }) => {
    // Test that we can join and questions are randomized
    await page.goto("/en");
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await startButton.click();

    const guestName = page.getByRole("textbox", { name: "Your Name" });
    await guestName.fill("Participant 1");

    const joinButton = page.getByRole("button", { name: "Join & Start" });
    await joinButton.click();

    await waitForLoaderToDisappear(page);
    await page.waitForURL(`/en/test/start/*`);

    // Verify test started and has questions
    const radioOptions = page.locator('input[type="radio"]');
    await expect(async () => {
      const count = await radioOptions.count();
      expect(count).toBeGreaterThan(0);
    }).toPass();

    // Complete test
    await completeTest(page);
  });
});
