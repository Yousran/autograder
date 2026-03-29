import { Page, Locator, expect } from "@playwright/test";
import { waitForLoaderToDisappear } from "./ui-interactions";

// ─────────────────────────────────────────────────────────────────────────
// Getter Functions: Locate Components
// ─────────────────────────────────────────────────────────────────────────

/**
 * Helper: Get the join code input element
 */
export function getJoinCodeInput(page: Page): Locator {
  return page.getByTestId("input-join-code");
}

/**
 * Helper: Get the join button
 */
export function getJoinButton(page: Page): Locator {
  return page.getByTestId("btn-join-home");
}

/**
 * Helper: Get the question count element
 */
export function getQuestionCountElement(page: Page): Locator {
  return page.getByTestId("question-count");
}

/**
 * Helper: Get the question text display element
 */
export function getQuestionTextDisplay(page: Page): Locator {
  return page.getByTestId("question-text-display");
}

/**
 * Helper: Get the next button
 */
export function getNextButton(page: Page): Locator {
  return page.getByTestId("btn-next");
}

/**
 * Helper: Get the previous button
 */
export function getPreviousButton(page: Page): Locator {
  return page.getByTestId("btn-previous");
}

// ─────────────────────────────────────────────────────────────────────────
// Set Functions: Submit Forms
// ─────────────────────────────────────────────────────────────────────────

/**
 * Helper: Set the join code input and click the Join button.
 */
export async function setJoinCode(page: Page, joinCode: string): Promise<void> {
  const joinCodeInput = getJoinCodeInput(page);
  const joinButton = getJoinButton(page);
  await joinCodeInput.focus();
  await joinCodeInput.fill(joinCode);
  await expect(joinButton).toBeEnabled();
  await joinButton.click();
}

/**
 * Helper: Get the current question number being displayed
 * Extracts the number from "Question X of Y" text using the test ID
 */
export async function getCurrentQuestionNumber(page: Page): Promise<number> {
  const questionCountElement = getQuestionCountElement(page);
  const text = await questionCountElement.textContent().catch(() => "");

  // Extract the first number (current question number)
  const match = text?.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/**
 * Helper: Extract current question text from the display
 * Gets the question text from the question text display element using test ID
 */
export async function getCurrentQuestionText(page: Page): Promise<string> {
  const questionContainer = getQuestionTextDisplay(page);
  const text = await questionContainer.textContent();
  return text?.trim() || "";
}

/**
 * Helper: Navigate to next question and wait for it to load
 */
export async function navigateToNextQuestion(page: Page): Promise<void> {
  const currentNum = await getCurrentQuestionNumber(page);
  const nextButton = getNextButton(page);

  await expect(nextButton).toBeEnabled({ timeout: 5000 });
  await nextButton.click();

  // Wait for question number to actually change
  await expect(async () => {
    const newNum = await getCurrentQuestionNumber(page);
    expect(newNum).toBe(currentNum + 1);
  }).toPass({ timeout: 5000 });
}

/**
 * Helper: Navigate to previous question and wait for it to load
 */
export async function navigateToPreviousQuestion(page: Page): Promise<void> {
  const currentNum = await getCurrentQuestionNumber(page);
  const prevButton = getPreviousButton(page);

  await expect(prevButton).toBeEnabled({ timeout: 5000 });
  await prevButton.click();

  // Wait for question number to actually change
  await expect(async () => {
    const newNum = await getCurrentQuestionNumber(page);
    expect(newNum).toBe(currentNum - 1);
  }).toPass({ timeout: 5000 });
}

/**
 * Helper: Answer a question on the test page with a specific choice text.
 * Finds and clicks the choice that matches the given text.
 */
export async function answerQuestionWithChoice(
  page: Page,
  choiceText: string,
): Promise<void> {
  // Find choice element by test ID pattern
  const choiceLabel = page.locator(`[data-testid^="choice-input-"]`).filter({
    hasText: choiceText,
  });

  await expect(async () => {
    await expect(choiceLabel).toBeVisible();
    await choiceLabel.first().click();
    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Answer a question on the test page with a choice by index.
 * choiceIndex: 0-based index of the choice to select
 */
export async function answerQuestionWithChoiceIndex(
  page: Page,
  choiceIndex: number,
): Promise<void> {
  await expect(async () => {
    // Find all choice inputs by data-testid pattern
    const choiceInputs = page.locator(`[data-testid^="choice-input-"]`);

    // Get the count and validate index is valid
    const count = await choiceInputs.count();
    expect(count).toBeGreaterThan(choiceIndex);

    // Select the target choice by index
    const targetChoice = choiceInputs.nth(choiceIndex);
    await expect(targetChoice).toBeVisible();

    // Scroll into view before clicking
    await targetChoice.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // Click the choice
    await targetChoice.click();
    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Answer all visible questions in a test session.
 * Assumes first question is already visible.
 */
export async function answerAllQuestions(
  page: Page,
  questionTexts: string[],
): Promise<void> {
  for (let i = 0; i < questionTexts.length; i++) {
    // Answer the current question (e.g., select first option for choice question)
    const choiceOption = page.getByTestId("choice-option-0");
    if (await choiceOption.isVisible().catch(() => false)) {
      await choiceOption.click();
    }

    // Move to next question if not the last one
    if (i < questionTexts.length - 1) {
      const nextButton = page.getByRole("button", { name: /next/i });
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(200); // Small delay for question to load
      }
    }
  }
}

/**
 * Helper: Complete a test and ensure a specific score is recorded.
 * For now, this answers all questions with the first choice.
 * Returns the participant ID.
 */
export async function completeTestWithParticipant(
  page: Page,
  joinCode: string,
): Promise<string> {
  await setJoinCode(page, joinCode);
  await page.waitForURL(`/en/join/${joinCode}`);

  const startButton = page.getByRole("button", { name: "Start Test" });
  await expect(startButton).toBeVisible();
  await startButton.click();

  // Handle confirmation dialog
  const confirmButton = page
    .getByRole("button", { name: /join.*start|submit/i })
    .first();
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }

  // Wait for test to start - use flexible pattern that works for both authenticated and guest users
  await page.waitForURL(/\/en\/test\/start\/.+/i);
  await waitForLoaderToDisappear(page);

  // Get participant ID from URL
  const url = page.url();
  // Try to extract from query parameter first (guest users), then from path (authenticated users)
  let participantId = "";
  const participantMatch = url.match(/participantId=([a-z0-9]+)/i);
  if (participantMatch) {
    participantId = participantMatch[1];
  } else {
    // For authenticated users, extract from path
    const pathMatch = url.match(/\/en\/test\/start\/([a-z0-9]+)/i);
    participantId = pathMatch ? pathMatch[1] : "";
  }

  // Answer all questions and complete test
  await completeTest(page);

  return participantId;
}

/**
 * Helper: Complete an active test session by clicking the Finish button.
 */
export async function completeTest(page: Page): Promise<void> {
  // Wait for finish button to appear (with extended timeout)
  const finishButton = page.getByTestId("btn-finish");

  await expect(async () => {
    await expect(finishButton).toBeVisible();
  }).toPass();

  await finishButton.click();
  await page.waitForTimeout(300);

  // Wait for confirmation button and click
  const confirmButton = page.getByRole("button", { name: /submit|confirm/i });

  await expect(async () => {
    await expect(confirmButton.first()).toBeEnabled();
    await confirmButton.first().click();
  }).toPass();
}

/**
 * Helper: Complete a test by answering questions with specific choice indices.
 * Takes an array of choice indices (0-based) for each question.
 */
export async function completeTestWithScores(
  page: Page,
  joinCode: string,
  choiceIndices: number[],
): Promise<string> {
  await setJoinCode(page, joinCode);
  await page.waitForURL(`/en/join/${joinCode}`);

  const startButton = page.getByRole("button", { name: "Start Test" });
  await expect(startButton).toBeVisible();
  await startButton.click();

  // Handle confirmation dialog
  const confirmButton = page
    .getByRole("button", { name: /join.*start|submit/i })
    .first();
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }

  // Wait for test to start
  await page.waitForURL(/\/en\/test\/start\/.+/i);
  await waitForLoaderToDisappear(page);

  // Get participant ID from URL
  const url = page.url();
  let participantId = "";
  const participantMatch = url.match(/participantId=([a-z0-9]+)/i);
  if (participantMatch) {
    participantId = participantMatch[1];
  } else {
    const pathMatch = url.match(/\/en\/test\/start\/([a-z0-9]+)/i);
    participantId = pathMatch ? pathMatch[1] : "";
  }

  // Answer each question with the specified choice
  for (let i = 0; i < choiceIndices.length; i++) {
    // Wait to ensure question is visible before answering
    await page.waitForTimeout(200);

    await answerQuestionWithChoiceIndex(page, choiceIndices[i]);
    await page.waitForTimeout(300);

    // Click Next if not the last question
    if (i < choiceIndices.length - 1) {
      const nextButton = page.getByRole("button", { name: /next/i }).first();
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(500); // Give question time to load
      }
    }
  }

  // Complete the test
  await page.waitForTimeout(300);
  await completeTest(page);

  return participantId;
}
