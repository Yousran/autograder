import { Page, Locator, expect } from "@playwright/test";
import { waitForLoaderToDisappear } from "./ui-interactions";

// ─────────────────────────────────────────────────────────────────────────
// Getter Functions: Locate Components
// ─────────────────────────────────────────────────────────────────────────

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
export function getQuestionCard(page: Page, questionIndex: number): Locator {
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
 * Helper: Get the question text area for a specific question
 */
export function getQuestionTextArea(
  page: Page,
  questionIndex: number,
): Locator {
  const questionCard = getQuestionCard(page, questionIndex);
  return questionCard.getByTestId("input-question-text");
}

/**
 * Helper: Get the add choice button for a specific question
 */
export function getAddChoiceButton(page: Page, questionIndex: number): Locator {
  const questionCard = getQuestionCard(page, questionIndex);
  return questionCard.getByTestId("btn-add-choice");
}

/**
 * Helper: Get a specific choice row by index
 * Uses nth() to select the choice at the given index (0-based) within the question
 */
export function getChoiceRow(
  page: Page,
  questionIndex: number,
  choiceIndex: number,
): Locator {
  const questionCard = getQuestionCard(page, questionIndex);
  return questionCard.locator('[data-testid^="choice-row-"]').nth(choiceIndex);
}

/**
 * Helper: Get the correct button for a specific choice
 */
export function getChoiceCorrectButton(
  page: Page,
  questionIndex: number,
  choiceIndex: number,
): Locator {
  const choiceRow = getChoiceRow(page, questionIndex, choiceIndex);
  return choiceRow.locator("button").first();
}

/**
 * Helper: Get the answer text area for a specific question (essay type)
 */
export function getAnswerTextArea(page: Page, questionIndex: number): Locator {
  const questionCard = getQuestionCard(page, questionIndex);
  return questionCard.getByTestId("textarea-essay-answer");
}

/**
 * Helper: Get the essay answer label
 */
export function getEssayAnswerLabel(page: Page): Locator {
  return page.getByTestId("label-essay-answer");
}

/**
 * Helper: Get the answer matching label
 */
export function getAnswerMatchingLabel(page: Page): Locator {
  return page.getByTestId("label-answer-matching");
}

/**
 * Helper: Get the max score label for a question
 */
export function getMaxScoreLabel(
  page: Page,
  type: "essay" | "choice" = "essay",
): Locator {
  if (type === "essay") {
    return page.getByTestId("label-max-score");
  }
  return page.getByTestId("label-choice-max-score");
}

/**
 * Helper: Get the choice randomized label
 */
export function getChoiceRandomizedLabel(page: Page): Locator {
  return page.getByTestId("label-choice-randomized");
}

/**
 * Helper: Get all add question buttons
 */
export function getAddQuestionButtons(page: Page): Locator {
  return page.getByTestId("btn-add-question");
}

/**
 * Helper: Get the add question divider at a specific position
 */
export function getAddQuestionDivider(
  page: Page,
  position: number = 0,
): Locator {
  return page.locator(".group\\/add").nth(position);
}

/**
 * Helper: Wait for sync indicator to show saved status
 * Checks the SyncStatusIndicator component instead of direct API responses.
 * Better for e2e testing as it verifies the UI has updated.
 *
 * @param page - The Playwright page object
 */
export async function waitForQuestionPatchResponse(page: Page): Promise<void> {
  const syncIndicator = page.getByTestId("sync-status-indicator");

  // Wait for sync indicator to appear and show saved status (green-500 class)
  await expect(syncIndicator).toBeVisible();
  await expect(syncIndicator).toHaveClass(/text-green-500/);
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

  const addButtons = getAddQuestionButtons(page);
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

  await setQuestionText(page, questionIndex, questionText);

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
      await setChoiceText(page, questionIndex, i, choices[i]);
      if (i === correctChoiceIndex) {
        await markChoiceAsCorrect(page, questionIndex, i);
      }
    }
  }
  // Handle essay questions
  if (type === "ESSAY" && answer) {
    await setQuestionAnswer(page, questionIndex, answer);
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
      await setChoiceText(page, questionIndex, i, choices[i]);
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
  const typeSelect = page
    .getByTestId("select-question-type")
    .nth(questionIndex);

  await expect(async () => {
    await typeSelect.click();
    await waitForLoaderToDisappear(page);

    const option = page.getByTestId(`option-question-type-${type}`);
    await option.first().click();
    await page.click("body");
  }).toPass();
}

/**
 * Helper: Set the question text for a specific question.
 */
export async function setQuestionText(
  page: Page,
  questionIndex: number,
  text: string,
): Promise<void> {
  await expect(async () => {
    const questionTextarea = getQuestionTextArea(page, questionIndex);
    await expect(questionTextarea).toBeVisible();
    await expect(questionTextarea).toBeEnabled();

    await questionTextarea.click();
    await questionTextarea.fill(text);
    await page.click("body");
    await waitForQuestionPatchResponse(page);
    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Add a choice option to a specific question.
 */
export async function addChoiceToQuestion(
  page: Page,
  questionIndex: number,
): Promise<void> {
  const addChoiceButton = getAddChoiceButton(page, questionIndex);

  await expect(async () => {
    await expect(addChoiceButton).toBeVisible();
    await addChoiceButton.click();
    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Set choice text for a specific choice in a question.
 * choiceIndex: 0-based index of the choice within the question
 * Scopes search to the specific question card to handle multiple questions correctly.
 */
export async function setChoiceText(
  page: Page,
  questionIndex: number,
  choiceIndex: number,
  text: string,
): Promise<void> {
  // Wait for any loading to complete
  await waitForLoaderToDisappear(page);

  await expect(async () => {
    const choiceRow = getChoiceRow(page, questionIndex, choiceIndex);
    await expect(choiceRow).toBeVisible();
    await expect(choiceRow).toBeEnabled();

    const choiceEditor = choiceRow.getByTestId("input-choice-text");
    await expect(choiceEditor).toBeVisible();
    await expect(choiceEditor).toBeEnabled();

    await choiceEditor.click();

    // Clear existing content and fill with new text
    await choiceEditor.fill(text);

    await page.click("body");

    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Mark a choice as correct for a specific question.
 * Detects if the choice is already marked as correct to avoid toggling it to incorrect.
 * Scopes to the specific question and choice row using data-testid.
 */
export async function markChoiceAsCorrect(
  page: Page,
  questionIndex: number,
  choiceIndex: number,
): Promise<void> {
  // Find the specific choice row by testid within this question
  const correctButton = getChoiceCorrectButton(
    page,
    questionIndex,
    choiceIndex,
  );

  await expect(async () => {
    await expect(correctButton).toBeVisible();

    // Check if the button is already marked as correct by checking its class
    // The "default" variant (for correct state) includes "bg-primary" class
    const buttonClass = await correctButton.getAttribute("class");
    const isAlreadyCorrect = buttonClass?.includes("bg-primary");

    // Only click if not already correct
    if (!isAlreadyCorrect) {
      await correctButton.click();
      await waitForLoaderToDisappear(page);
    }
  }).toPass();
}

/**
 * Helper: Set the answer text for a specific question (essay type).
 */
export async function setQuestionAnswer(
  page: Page,
  questionIndex: number,
  answer: string,
): Promise<void> {
  const answerTextarea = getAnswerTextArea(page, questionIndex);

  await expect(async () => {
    await expect(answerTextarea).toBeVisible();
    await answerTextarea.click();
    await answerTextarea.fill(answer);
    await page.click("body");
    await waitForLoaderToDisappear(page);
  }).toPass();
}

// ─────────────────────────────────────────────────────────────────────────
// Question Reordering Functions
// ─────────────────────────────────────────────────────────────────────────

/**
 * Helper: Get the question order number for a specific question
 * Returns the displayed order number (1-based index)
 */
export async function getQuestionOrder(
  page: Page,
  questionIndex: number,
): Promise<string> {
  const questionCard = getQuestionCard(page, questionIndex);
  const orderElement = questionCard.locator('[data-testid^="question-order-"]');
  const text = await orderElement.textContent();
  return text ?? "";
}

/**
 * Helper: Get the question holder (the draggable handle) for a specific question
 */
export function getQuestionHolder(page: Page, questionIndex: number): Locator {
  const questionCard = getQuestionCard(page, questionIndex);
  return questionCard.locator('[data-testid^="question-holder-"]');
}

/**
 * Helper: Reorder questions by dragging a question from sourceIndex to targetIndex
 * This simulates the drag-and-drop functionality for question reordering.
 * Uses mouse operations with scroll-during-drag to handle targets outside viewport.
 *
 * @param page - The Playwright page object
 * @param sourceIndex - The 0-based index of the question to move
 * @param targetIndex - The 0-based index where the question should be moved to
 */
export async function reorderQuestions(
  page: Page,
  sourceIndex: number,
  targetIndex: number,
): Promise<void> {
  const sourceCard = getQuestionCard(page, sourceIndex);
  const targetCard = getQuestionCard(page, targetIndex);

  // Scroll source into view
  await sourceCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const dragHandle = getQuestionHolder(page, sourceIndex);
  await expect(dragHandle).toBeVisible();

  // Get the drag handle position
  const handleBox = await dragHandle.boundingBox();
  if (!handleBox) throw new Error("Drag handle bounding box not found");

  // Start dragging from the handle
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );

  await page.mouse.down();

  // Start dragging from the handle
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + 20 + handleBox.height / 2,
  );

  // Scroll target into view while the mouse button is held
  await targetCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  await page.mouse.up();

  // Wait for the UI to update after drop
  await waitForLoaderToDisappear(page);

  // Wait for animation to complete
  await page.waitForTimeout(300);
}

/**
 * Helper: Get the max score input element
 */
export function getMaxScoreInput(locator: Locator): Locator {
  return locator.getByTestId("input-max-score").locator('input[type="text"]');
}

// ─────────────────────────────────────────────────────────────────────────
// Question State Management Functions
// ─────────────────────────────────────────────────────────────────────────

/**
 * Helper: Get the max score value for a specific question
 * Returns the input value or null if not set
 */
export async function getMaxScore(
  page: Page,
  questionIndex: number,
): Promise<number | null> {
  const questionCard = getQuestionCard(page, questionIndex);
  const maxScoreInput = getMaxScoreInput(questionCard);
  const value = await maxScoreInput.inputValue();
  return value ? parseInt(value, 10) : null;
}

/**
 * Helper: Set the max score value for a specific question
 * Waits for the PATCH response and loader to disappear
 */
export async function setMaxScore(
  page: Page,
  questionIndex: number,
  score: number,
): Promise<void> {
  const questionCard = getQuestionCard(page, questionIndex);
  const maxScoreInput = getMaxScoreInput(questionCard);

  await expect(async () => {
    await maxScoreInput.click();
    await maxScoreInput.fill(score.toString());
    await page.click("body");
    await waitForQuestionPatchResponse(page);
    await waitForLoaderToDisappear(page);
    await maxScoreInput.press("Enter");
  }).toPass();
}

/**
 * Helper: Get the isExactAnswer toggle state for a specific question (essay type)
 * Returns true if the toggle is checked, false otherwise
 */
export async function getIsExactAnswerState(
  page: Page,
  questionIndex: number,
): Promise<boolean> {
  const questionCard = getQuestionCard(page, questionIndex);
  const toggleSwitch = questionCard.getByTestId("toggle-is-exact-answer");
  const isChecked = await toggleSwitch.isChecked();
  return isChecked;
}

/**
 * Helper: Toggle the isExactAnswer state for a specific question (essay type)
 * Waits for the PATCH response and loader to disappear
 */
export async function toggleIsExactAnswer(
  page: Page,
  questionIndex: number,
): Promise<void> {
  const questionCard = getQuestionCard(page, questionIndex);
  const toggleSwitch = questionCard.getByTestId("toggle-is-exact-answer");

  await expect(async () => {
    await expect(toggleSwitch).toBeVisible();
    await expect(toggleSwitch).toBeEnabled();
    await toggleSwitch.click();
    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Get the isChoiceRandomized toggle state for a specific question (choice/multiple-select type)
 * Returns true if the toggle is checked, false otherwise
 */
export async function getIsChoiceRandomizedState(
  page: Page,
  questionIndex: number,
): Promise<boolean> {
  const questionCard = getQuestionCard(page, questionIndex);
  const toggleSwitch = questionCard.getByTestId("toggle-choice-randomized");
  const isChecked = await toggleSwitch.isChecked();
  return isChecked;
}

/**
 * Helper: Toggle the isChoiceRandomized state for a specific question (choice/multiple-select type)
 * Waits for the PATCH response and loader to disappear
 */
export async function toggleIsChoiceRandomized(
  page: Page,
  questionIndex: number,
): Promise<void> {
  const questionCard = getQuestionCard(page, questionIndex);
  const toggleSwitch = questionCard.getByTestId("toggle-choice-randomized");

  await expect(async () => {
    await expect(toggleSwitch).toBeVisible();
    await expect(toggleSwitch).toBeEnabled();
    await toggleSwitch.click();
    await waitForLoaderToDisappear(page);
  }).toPass();
}
