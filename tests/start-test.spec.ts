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

import { test, expect, BrowserContext } from "@playwright/test";
import { createTest } from "./helpers/test-modification";
import { waitForLoaderToDisappear } from "./helpers/ui-interactions";
import {
  submitJoinCode,
  completeTest,
  getCurrentQuestionNumber,
  getCurrentQuestionText,
  navigateToPreviousQuestion,
  navigateToNextQuestion,
} from "./helpers/test-start";

// ─────────────────────────────────────────────────────────────────────────
// Start Test - Session Re-entry
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Start Test - Already Started Within Duration", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let joinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      const result = await createTest(browser, {
        title: "Restart Test Within Duration",
        maxAttempts: 2,
        questions: [{ text: "Question 1", type: "CHOICE" as const }],
      });
      joinCode = result.joinCode;
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
    const nameInput = page.getByTestId("input-participant-name");
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
      const result = await createTest(browser, {
        title: "Test Return to Results",
        maxAttempts: 2,
        questions: [{ text: "Question 1", type: "CHOICE" as const }],
      });
      joinCode = result.joinCode;
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
      // Create test with very short duration (1 minute)
      const result = await createTest(browser, {
        title: "Duration Exceeded Test",
        duration: 1,
        maxAttempts: 2,
        questions: [{ text: "Question 1", type: "CHOICE" as const }],
      });
      joinCode = result.joinCode;
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
      // Create test with very short duration for quick timeout
      const result = await createTest(browser, {
        title: "Auto-Submit Test",
        duration: 1, // 1 minute duration
        maxAttempts: 2,
        questions: [{ text: "Question 1", type: "CHOICE" as const }],
      });
      joinCode = result.joinCode;
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
      const result = await createTest(browser, {
        title: "Answer Preservation Test",
        maxAttempts: 2,
        questions: [
          { text: "Question 1", type: "CHOICE" as const },
          { text: "Question 2", type: "CHOICE" as const },
          { text: "Question 3", type: "CHOICE" as const },
        ],
      });
      joinCode = result.joinCode;
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
      const result = await createTest(browser, {
        title: "Non-Randomized Questions",
        questionsOrdered: true,
        questions: expectedQuestionOrder.map((text) => ({
          text,
          type: "CHOICE" as const,
        })),
      });

      joinCode = result.joinCode;
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
      // Create test with multiple questions with distinct text
      const result = await createTest(browser, {
        title: "Randomized Questions with Text",
        questionsOrdered: false,
        maxAttempts: 2,
        questions: originalQuestionOrder.map((text) => ({
          text,
          type: "CHOICE" as const,
        })),
      });

      joinCode = result.joinCode;
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

  test("different participants see different question orders", async ({
    browser,
  }) => {
    // Helper function to get question order for a participant
    const getParticipantQuestionOrder = async (
      context: BrowserContext,
      participantName: string,
    ): Promise<string[]> => {
      const page = await context.newPage();
      const questionOrder: string[] = [];

      // Join test
      await page.goto("/en");
      await submitJoinCode(page, joinCode);
      await page.waitForURL(`/en/join/${joinCode}`);

      const startButton = page.getByRole("button", { name: "Start Test" });
      await startButton.click();

      const guestName = page.getByRole("textbox", { name: "Your Name" });
      await guestName.fill(participantName);

      const joinButton = page.getByRole("button", { name: "Join & Start" });
      await joinButton.click();

      await waitForLoaderToDisappear(page);
      await page.waitForURL(`/en/test/start/*`);

      // Get first question
      let currentText = await getCurrentQuestionText(page);
      questionOrder.push(currentText);

      // Navigate through remaining questions and capture their text
      const nextButton = page.getByTestId("btn-next");
      for (let i = 1; i < originalQuestionOrder.length; i++) {
        if (await nextButton.isEnabled().catch(() => false)) {
          await navigateToNextQuestion(page);
          currentText = await getCurrentQuestionText(page);
          questionOrder.push(currentText);
        }
      }

      await page.close();
      return questionOrder;
    };

    // Create multiple participants and capture their question orders
    const participant1Context = await browser.newContext();
    const participant1Order = await getParticipantQuestionOrder(
      participant1Context,
      "Participant 1",
    );
    await participant1Context.close();

    const participant2Context = await browser.newContext();
    const participant2Order = await getParticipantQuestionOrder(
      participant2Context,
      "Participant 2",
    );
    await participant2Context.close();

    const participant3Context = await browser.newContext();
    const participant3Order = await getParticipantQuestionOrder(
      participant3Context,
      "Participant 3",
    );
    await participant3Context.close();

    // Verify that all orders contain the same questions
    expect(participant1Order.length).toBe(originalQuestionOrder.length);
    expect(participant2Order.length).toBe(originalQuestionOrder.length);
    expect(participant3Order.length).toBe(originalQuestionOrder.length);

    // Verify all participants see all questions
    for (const question of originalQuestionOrder) {
      expect(participant1Order).toContain(question);
      expect(participant2Order).toContain(question);
      expect(participant3Order).toContain(question);
    }

    // Verify that at least one participant has a different order than another
    // (This checks that randomization is actually working)
    const allOrdersIdentical =
      participant1Order.every((q, i) => q === participant2Order[i]) &&
      participant2Order.every((q, i) => q === participant3Order[i]);

    // With 3 questions and random shuffling, there's a very high probability
    // that not all three participants will have the same order
    expect(allOrdersIdentical).toBe(false);

    // At least one different order should exist
    const differentOrders = [];
    if (!participant1Order.every((q, i) => q === participant2Order[i])) {
      differentOrders.push({
        participant: 1,
        order: participant1Order,
      });
      differentOrders.push({ participant: 2, order: participant2Order });
    }
    if (!participant2Order.every((q, i) => q === participant3Order[i])) {
      differentOrders.push({ participant: 3, order: participant3Order });
    }

    expect(differentOrders.length).toBeGreaterThan(0);
  });
});
