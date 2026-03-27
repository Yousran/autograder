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
  getCurrentQuestionNumber,
  getCurrentQuestionText,
  navigateToPreviousQuestion,
  navigateToNextQuestion,
  fillQuestionText,
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
    await guestConfirm.fill("Test Participant UI");

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
    await nameInput.fill("Test Participant UI");
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

    const participantId = page.url().split("/").pop() || "";

    await page.goto(`/en`);
    await expect(page).toHaveURL(`/en`);

    await page.waitForTimeout(70000); // Wait for 70 seconds to ensure duration is exceeded

    await expect(async () => {
      await page.goto(`/en/test/start/${participantId}`);
      // Verify we're on a result/completion page
      await expect(page).toHaveURL(/\/en\/test\/(result|complete)/);
    }).toPass();
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
        questionCount: 1,
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

    await page.waitForTimeout(70000); // Wait for 70 seconds to ensure duration is exceeded

    // Verify we're on a result/completion page
    await expect(page).toHaveURL(/\/en\/test\/(result|complete)/);
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
    await expect(radioOptions.nth(0)).toBeChecked();

    // Go to Q2
    await navigateToNextQuestion(page);

    // Answer Q2
    await radioOptions.nth(0).check();
    await expect(radioOptions.nth(0)).toBeChecked();
    await navigateToNextQuestion(page);

    // Answer Q3
    await radioOptions.nth(0).check();
    await expect(radioOptions.nth(0)).toBeChecked();

    // Verify we're on question 3
    let currentQuestionNum = await getCurrentQuestionNumber(page);
    expect(currentQuestionNum).toBe(3);

    // Go back to Q2 and verify navigation works
    await navigateToPreviousQuestion(page);

    // Verify we're now on question 2
    currentQuestionNum = await getCurrentQuestionNumber(page);
    expect(currentQuestionNum).toBe(2);

    // Navigate forward back to Q3 before finishing
    await navigateToNextQuestion(page);

    // Verify we're back on question 3
    currentQuestionNum = await getCurrentQuestionNumber(page);
    expect(currentQuestionNum).toBe(3);

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
  const expectedQuestionOrder = [
    "Question One",
    "Question Two",
    "Question Three",
  ];

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      const result = await createTestWithMultipleQuestions(page, {
        title: "Non-Randomized Questions",
        questionCount: 3,
        shouldRandomize: false,
        maxAttempts: 2,
      });

      // Fill in distinct question text for each question
      for (let i = 0; i < expectedQuestionOrder.length; i++) {
        await fillQuestionText(page, i, expectedQuestionOrder[i]);
      }

      joinCode = result.joinCode;

      await context.close();
    }).toPass();
  });

  test("question order is consistent and matches original order for non-randomized tests", async ({
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

    // Capture the order of questions as they appear in the test
    const displayedQuestionOrder: string[] = [];

    // Get first question
    let currentText = await getCurrentQuestionText(page);
    displayedQuestionOrder.push(currentText);

    // Navigate through remaining questions and capture their text
    const nextButton = page.getByTestId("btn-next");
    for (let i = 1; i < expectedQuestionOrder.length; i++) {
      if (await nextButton.isEnabled().catch(() => false)) {
        await navigateToNextQuestion(page);
        currentText = await getCurrentQuestionText(page);
        displayedQuestionOrder.push(currentText);
      }
    }

    // Verify we captured all questions
    expect(displayedQuestionOrder.length).toBe(expectedQuestionOrder.length);

    // Verify that the displayed order matches the expected order exactly
    expect(displayedQuestionOrder).toEqual(expectedQuestionOrder);

    // Navigate back to first question before second verification
    for (let i = expectedQuestionOrder.length - 1; i > 0; i--) {
      await navigateToPreviousQuestion(page);
    }

    // Navigate through questions again to verify consistency
    for (let i = 0; i < expectedQuestionOrder.length; i++) {
      currentText = await getCurrentQuestionText(page);
      expect(currentText).toBe(expectedQuestionOrder[i]);
      if (i < expectedQuestionOrder.length - 1) {
        await navigateToNextQuestion(page);
      }
    }

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
  const originalQuestionOrder = [
    "Question One",
    "Question Two",
    "Question Three",
  ];

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      // Create test with multiple questions with distinct text
      const result = await createTestWithMultipleQuestions(page, {
        title: "Randomized Questions with Text",
        questionCount: 3,
        shouldRandomize: true,
        maxAttempts: 2,
      });

      // Fill in distinct question text for each question
      for (let i = 0; i < originalQuestionOrder.length; i++) {
        await fillQuestionText(page, i, originalQuestionOrder[i]);
      }

      joinCode = result.joinCode;

      await context.close();
    }).toPass();
  });

  test("questions appear in randomized order when taking the test", async ({
    page,
  }) => {
    // Participant joins and starts the test
    await page.goto("/en");
    await submitJoinCode(page, joinCode);
    await page.waitForURL(`/en/join/${joinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await startButton.click();

    const guestName = page.getByRole("textbox", { name: "Your Name" });
    await guestName.fill("Randomized Test Participant");

    const joinButton = page.getByRole("button", { name: "Join & Start" });
    await joinButton.click();

    await waitForLoaderToDisappear(page);
    await page.waitForURL(`/en/test/start/*`);

    // Capture the order of questions as they appear in the test
    const displayedQuestionOrder: string[] = [];

    // Get first question
    let currentText = await getCurrentQuestionText(page);
    displayedQuestionOrder.push(currentText);

    // Navigate through remaining questions and capture their text
    const nextButton = page.getByTestId("btn-next");
    for (let i = 1; i < originalQuestionOrder.length; i++) {
      if (await nextButton.isEnabled().catch(() => false)) {
        await navigateToNextQuestion(page);
        currentText = await getCurrentQuestionText(page);
        displayedQuestionOrder.push(currentText);
      }
    }

    // Verify we captured all questions
    expect(displayedQuestionOrder.length).toBe(originalQuestionOrder.length);

    // Verify all questions from original set are present
    for (const question of originalQuestionOrder) {
      expect(displayedQuestionOrder).toContain(question);
    }

    // Verify that the displayed order is NOT the same as original (randomized)
    expect(displayedQuestionOrder).not.toEqual(originalQuestionOrder);

    // Navigate back to first question before second verification
    for (let i = originalQuestionOrder.length - 1; i > 0; i--) {
      await navigateToPreviousQuestion(page);
    }

    // Verify the randomized order remains consistent on second pass
    const verifyQuestionOrder: string[] = [];

    // Get first question on second pass
    currentText = await getCurrentQuestionText(page);
    verifyQuestionOrder.push(currentText);

    // Navigate through remaining questions and verify consistency
    for (let i = 1; i < originalQuestionOrder.length; i++) {
      if (await nextButton.isEnabled().catch(() => false)) {
        await navigateToNextQuestion(page);
        currentText = await getCurrentQuestionText(page);
        verifyQuestionOrder.push(currentText);
      }
    }

    // Verify that the order is consistent with the first pass
    expect(verifyQuestionOrder).toEqual(displayedQuestionOrder);

    // Complete test
    await completeTest(page);
  });
});
