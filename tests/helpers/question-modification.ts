import { Page, expect } from "@playwright/test";
import { waitForLoaderToDisappear } from "./ui-interactions";

/**
 * Helper: Get the number of questions in the current test.
 * Counts elements with data-testid matching "question-card-*" pattern.
 */
export async function getQuestionCount(page: Page): Promise<number> {
  return page.locator('[data-testid^="question-card-"]').count();
}

/**
 * Helper: Get a specific question card by index (0-based).
 * Selects elements with data-testid matching "question-card-*" pattern.
 */
export function getQuestionCard(page: Page, questionIndex: number) {
  return page.locator('[data-testid^="question-card-"]').nth(questionIndex);
}

/**
 * Helper: Get a specific choice by index (0-based).
 * Selects elements with data-testid matching "choice-row-*" pattern within the question.
 */
export async function getChoiceCount(
  page: Page,
  questionIndex: number,
): Promise<number> {
  const questionCard = getQuestionCard(page, questionIndex);
  return questionCard.locator('[data-testid^="choice-row-"]').count();
}

/**
 * Helper: Add a new question to the test with optional configuration.
 * Returns the 0-based index of the newly created question.
 *
 * @param page - Playwright page object
 * @param options - Optional configuration for the question
 * @param options.questionText - Text content of the question
 * @param options.type - Question type: "ESSAY", "CHOICE", or "MULTIPLE_SELECT"
 * @param options.choices - Array of choice text (for CHOICE and MULTIPLE_SELECT types)
 * @param options.correctChoiceIndex - Index of the correct choice (for CHOICE type)
 * @param options.answer - Answer text (for ESSAY type)
 */
export async function addQuestion(
  page: Page,
  {
    questionText = "Sample question text",
    type = "CHOICE",
    choices = ["Choice 1", "Choice 2", "Choice 3"],
    correctChoiceIndex = 0,
    answer = null,
  }: {
    questionText?: string;
    type?: "ESSAY" | "CHOICE" | "MULTIPLE_SELECT";
    choices?: string[] | null;
    correctChoiceIndex?: number | null;
    answer?: string | null;
  } = {},
): Promise<number> {
  const existingCount = await getQuestionCount(page);

  const addButtons = page.getByRole("button", { name: /add question/i });
  await expect(async () => {
    await expect(addButtons.last()).toBeVisible();
    await addButtons.last().click();
  }).toPass();

  // Wait for new question to appear
  await expect(async () => {
    const newCount = await getQuestionCount(page);
    expect(newCount).toBe(existingCount + 1);
  }).toPass();

  const questionIndex = existingCount;

  await setQuestionType(page, questionIndex, type);

  await fillQuestionText(page, questionIndex, questionText);

  // Handle choice questions
  if (type === "CHOICE" && choices) {
    // Get the actual number of existing choices in the question
    const existingChoicesCount = await getChoiceCount(page, questionIndex);
    const choicesToAdd = Math.max(0, choices.length - existingChoicesCount);

    // Add additional choices if needed
    for (let i = 0; i < choicesToAdd; i++) {
      await addChoiceToQuestion(page, questionIndex);
    }

    // Fill all choices
    for (let i = 0; i < choices.length; i++) {
      await fillChoiceText(page, questionIndex, i, choices[i]);
      if (i === correctChoiceIndex) {
        await markChoiceAsCorrect(page, questionIndex, i);
      }
    }
  }
  // Handle essay questions
  if (type === "ESSAY" && answer) {
    await fillQuestionAnswer(page, questionIndex, answer);
  }
  // Handle multiple select questions
  if (type === "MULTIPLE_SELECT" && choices) {
    // Get the actual number of existing choices in the question
    const existingChoicesCount = await getChoiceCount(page, questionIndex);
    const choicesToAdd = Math.max(0, choices.length - existingChoicesCount);

    // Add additional choices if needed
    for (let i = 0; i < choicesToAdd; i++) {
      await addChoiceToQuestion(page, questionIndex);
    }

    // Fill all choices
    for (let i = 0; i < choices.length; i++) {
      await fillChoiceText(page, questionIndex, i, choices[i]);
      if (i === correctChoiceIndex) {
        await markChoiceAsCorrect(page, questionIndex, i);
      }
    }
  }

  return questionIndex;
}

/**
 * Helper: Set the type of a specific question.
 * Types: "ESSAY", "CHOICE", "MULTIPLE_SELECT"
 */
export async function setQuestionType(
  page: Page,
  questionIndex: number,
  type: "ESSAY" | "CHOICE" | "MULTIPLE_SELECT",
): Promise<void> {
  const typeSelect = page.locator('[role="combobox"]').nth(questionIndex);

  await expect(async () => {
    await typeSelect.click();
    await waitForLoaderToDisappear(page);

    const typeMap: Record<string, RegExp> = {
      ESSAY: /^essay$/i,
      CHOICE: /^choice|single/i,
      MULTIPLE_SELECT: /^multiple|select/i,
    };

    const option = page.getByRole("option", { name: typeMap[type] });
    await option.first().click();
  }).toPass();
}

/**
 * Helper: Fill the question text for a specific question.
 */
export async function fillQuestionText(
  page: Page,
  questionIndex: number,
  text: string,
): Promise<void> {
  // Get the specific question card to scope the search
  const questionCard = getQuestionCard(page, questionIndex);

  // Find the textarea within this specific question card
  const questionTextarea = questionCard
    .getByRole("textbox")
    .filter({ hasText: /question text|enter question/i })
    .first();

  await expect(async () => {
    await questionTextarea.click();
    await questionTextarea.fill(text);
    await page.click("body");
    await page.waitForTimeout(200); // Small delay for question to load
  }).toPass();
}

/**
 * Helper: Add a choice option to a specific question.
 */
export async function addChoiceToQuestion(
  page: Page,
  questionIndex: number,
): Promise<void> {
  const questionCard = getQuestionCard(page, questionIndex);
  const addChoiceButton = questionCard.getByRole("button", {
    name: /add choice/i,
  });

  await expect(async () => {
    await expect(addChoiceButton).toBeVisible();
    await addChoiceButton.click();
    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Fill choice text for a specific choice in a question.
 * choiceIndex: 0-based index of the choice within the question
 * Scopes search to the specific question card to handle multiple questions correctly.
 */
export async function fillChoiceText(
  page: Page,
  questionIndex: number,
  choiceIndex: number,
  text: string,
): Promise<void> {
  // Wait for any loading to complete
  await waitForLoaderToDisappear(page);

  // Get the specific question card to scope search
  const questionCard = getQuestionCard(page, questionIndex);

  // Find the choice row within this specific question
  const choiceRow = questionCard.locator(
    `[data-testid="choice-row-${choiceIndex}"]`,
  );

  await expect(async () => {
    await choiceRow.isVisible();

    const choiceEditor = choiceRow
      .getByRole("textbox")
      .filter({ hasText: /choice text/i });

    await choiceEditor.waitFor({ state: "visible" });

    await choiceEditor.click();

    // Clear existing content and fill with new text
    await choiceEditor.fill(text);

    await page.click("body");

    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Mark a choice as correct for a specific question.
 * Scopes to the specific question and choice row using data-testid.
 */
export async function markChoiceAsCorrect(
  page: Page,
  questionIndex: number,
  choiceIndex: number,
): Promise<void> {
  const questionCard = getQuestionCard(page, questionIndex);

  // Find the specific choice row by testid within this question
  const choiceRow = questionCard.locator(
    `[data-testid="choice-row-${choiceIndex}"]`,
  );

  // Find the toggle/mark correct button (first button in the choice row)
  const correctButton = choiceRow.locator("button").first();

  await expect(async () => {
    await expect(correctButton).toBeVisible();
    await correctButton.click();
    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Fill the answer text for a specific question (essay type).
 */
export async function fillQuestionAnswer(
  page: Page,
  questionIndex: number,
  answer: string,
): Promise<void> {
  const answerTextarea = page
    .locator('textarea[placeholder*="answer"], textarea[id="answer"]')
    .nth(questionIndex);

  await expect(async () => {
    await expect(answerTextarea).toBeVisible();
    await answerTextarea.click();
    await answerTextarea.fill(answer);
    await page.click("body");
    await waitForLoaderToDisappear(page);
  }).toPass();
}
