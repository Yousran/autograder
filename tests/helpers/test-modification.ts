import { Browser, Page, Locator, expect } from "@playwright/test";
import {
  waitForLoaderToDisappear,
  waitForSkeletonToDisappear,
} from "./ui-interactions";
import { addQuestion } from "./question-modification";

// ─────────────────────────────────────────────────────────────────────────
// Getter Functions: Locate Components
// ─────────────────────────────────────────────────────────────────────────

/**
 * Helper: Get the test title preview element
 */
export function getTestTitlePreview(page: Page): Locator {
  return page.getByTestId("test-title-preview");
}

/**
 * Helper: Get the test title input element
 */
export function getTestTitleInput(page: Page): Locator {
  return page.getByTestId("test-title-input");
}

/**
 * Helper: Get the test description preview element
 */
export function getTestDescriptionPreview(page: Page): Locator {
  return page.getByTestId("test-description-preview");
}

/**
 * Helper: Get the test description input element
 */
export function getTestDescriptionInput(page: Page): Locator {
  return page.getByTestId("test-description-input");
}

/**
 * Helper: Get the max attempts input element
 */
export function getMaxAttemptsInput(page: Page): Locator {
  return page.getByTestId("input-max-attempts").locator('input[type="text"]');
}

/**
 * Helper: Get the duration input element
 */
export function getDurationInput(page: Page): Locator {
  return page.getByTestId("input-duration").locator('input[type="text"]');
}

/**
 * Helper: Get the accepting responses toggle
 */
export function getToggleAcceptingResponses(page: Page): Locator {
  return page.getByTestId("toggle-accepting-responses");
}

/**
 * Helper: Get the logged in only toggle
 */
export function getToggleLoggedInOnly(page: Page): Locator {
  return page.getByTestId("toggle-logged-in-only");
}

/**
 * Helper: Get the detailed score toggle
 */
export function getToggleDetailedScore(page: Page): Locator {
  return page.getByTestId("toggle-detailed-score");
}

/**
 * Helper: Get the correct answers toggle
 */
export function getToggleCorrectAnswers(page: Page): Locator {
  return page.getByTestId("toggle-correct-answers");
}

/**
 * Helper: Get the questions ordered toggle
 */
export function getToggleQuestionsOrdered(page: Page): Locator {
  return page.getByTestId("toggle-questions-ordered");
}

/**
 * Helper: Wait for a PATCH response to /api/tests/{testId}
 * Extracts testId from the current page URL automatically.
 * Used by functions that modify test settings via API.
 *
 * @param page - The Playwright page object
 */
export async function waitForTestPatchResponse(page: Page): Promise<void> {
  const url = page.url();
  const testIdMatch = url.match(/test\/([a-z0-9]+)/i);
  const testId = testIdMatch ? testIdMatch[1] : "";

  if (!testId) {
    throw new Error("Unable to extract testId from URL: " + url);
  }

  await page.waitForResponse(
    (response) =>
      response.url().includes(`/api/tests/${testId}`) &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );
}

/**
 * Helper: Generic helper to create a test with customizable configuration.
 * Supports creating tests with single/multiple questions with custom configuration.
 *
 * @param page - The Playwright page object
 * @param options - Configuration object
 *
 * @example
 * // Create simple test with no questions
 * createTest(page, { title: "Test 1" });
 *
 * @example
 * // Create test with multiple questions
 * createTest(page, {
 *   title: "Multi Q Test",
 *   questions: [
 *     { text: "Q1", type: "ESSAY" },
 *     { text: "Q2", type: "ESSAY" }
 *   ]
 * });
 *
 * @example
 * // Create test with scoring (choice question)
 * createTest(page, {
 *   title: "Scoring Test",
 *   questions: [{
 *     text: "What is 2+2?",
 *     type: "CHOICE",
 *     choices: ["4", "5", "6"],
 *     correctChoiceIndex: 0,
 *   }]
 * });
 */
export async function createTest(
  browser: Browser,
  {
    title = "New Test",
    description = "Test description",
    duration = null,
    maxAttempts = null,
    acceptingResponses = true,
    loggedInOnly = false,
    questionsOrdered = true,
    questions = null,
  }: {
    title?: string;
    description?: string;
    duration?: number | null;
    maxAttempts?: number | null;
    acceptingResponses?: boolean;
    loggedInOnly?: boolean;
    questionsOrdered?: boolean;
    questions?: Array<{
      text?: string;
      type?: "ESSAY" | "CHOICE" | "MULTIPLE_SELECT";
      choices?: string[];
      correctChoiceIndex?: number;
      answer?: string;
    }> | null;
  } = {},
): Promise<{ joinCode: string; testId: string }> {
  const context = await browser.newContext({
    storageState: "playwright/.auth/user.json",
  });
  const page = await context.newPage();
  await page.goto("/en");

  const createButton = page.getByRole("button", { name: "Create New Test" });
  await createButton.waitFor({ state: "visible" });
  await createButton.click();

  await page.waitForURL(/\/en\/test\/[a-z0-9]+/i);

  const url = page.url();
  const testIdMatch = url.match(/test\/([a-z0-9]+)/i);
  const testId = testIdMatch ? testIdMatch[1] : "";

  // Update test title
  await setTestTitle(page, title);

  // Go to Settings tab and update configuration
  await TestNavigateToTab(page, "settings");

  // Update test description
  await setTestDescription(page, description);

  if (duration !== null) {
    await setDuration(page, duration);
  }
  if (maxAttempts !== null) {
    await setMaxAttempts(page, maxAttempts);
  }

  await toggleTestSetting(
    page,
    "toggle-accepting-responses",
    acceptingResponses,
  );

  await toggleTestSetting(page, "toggle-logged-in-only", loggedInOnly);

  await toggleTestSetting(page, "toggle-questions-ordered", questionsOrdered);

  // Create questions
  await TestNavigateToTab(page, "questions");

  if (questions && questions.length > 0) {
    // Create questions with custom configuration
    for (const questionConfig of questions) {
      await addQuestion(page, {
        questionText: questionConfig.text,
        type: questionConfig.type,
        choices: questionConfig.choices,
        correctChoiceIndex: questionConfig.correctChoiceIndex,
        answer: questionConfig.answer,
      });
    }
  }

  const joinCode = await getJoinCode(page);

  return { joinCode, testId };
}

/**
 * Helper: Click the Questions tab and wait for the panel to become active.
 * Automatically waits for skeleton loaders to disappear when navigating to the questions tab.
 * Ensures tab and tabPanel are hydrated and ready before interaction.
 */
export async function TestNavigateToTab(
  page: Page,
  tabName: "questions" | "settings" | "participants",
): Promise<void> {
  let tab;
  let tabPanel;

  switch (tabName) {
    case "settings":
      tab = page.getByTestId("tab-settings");
      tabPanel = page.getByTestId("tabpanel-settings");
      break;
    case "questions":
      tab = page.getByTestId("tab-questions");
      tabPanel = page.getByTestId("tabpanel-questions");
      break;
    case "participants":
      tab = page.getByTestId("tab-participants");
      tabPanel = page.getByTestId("tabpanel-participants");
      break;
  }

  await expect(async () => {
    // Wait for tab to be visible and enabled before clicking
    await expect(tab).toBeVisible();
    await expect(tab).toBeEnabled();

    await tab.click();

    // Wait for tabPanel to become visible after clicking
    await expect(tabPanel).toBeVisible();

    // Wait for skeleton loaders to disappear
    await waitForSkeletonToDisappear(page);
  }).toPass();
}

/**
 * Helper: Get the join code from the test page.
 */
export async function getJoinCode(page: Page): Promise<string> {
  const joinCodeElement = page.getByTestId("join-code-display");
  await expect(async () => {
    await expect(joinCodeElement).toBeVisible();
  }).toPass();
  const joinCode = await joinCodeElement.textContent();
  return joinCode?.trim() || "";
}

// ─────────────────────────────────────────────────────────────────────────
// Set Functions: Update Test Settings
// ─────────────────────────────────────────────────────────────────────────

/**
 * Helper: Set the test title.
 */
export async function setTestTitle(page: Page, title: string): Promise<void> {
  const titlePreview = getTestTitlePreview(page);
  await titlePreview.hover();
  await titlePreview.click();

  const titleInput = getTestTitleInput(page);
  await titleInput.waitFor({ state: "visible" });
  await titleInput.fill(title);
  await titleInput.press("Enter");

  await waitForTestPatchResponse(page);
}

/**
 * Helper: Set the test description.
 */
export async function setTestDescription(
  page: Page,
  description: string,
): Promise<void> {
  const descriptionPreview = getTestDescriptionPreview(page);
  await descriptionPreview.hover();
  await descriptionPreview.click();

  const descriptionInput = getTestDescriptionInput(page);
  await descriptionInput.waitFor({ state: "visible" });
  await descriptionInput.fill(description);
  await descriptionInput.press("Enter");

  await waitForTestPatchResponse(page);
}

/**
 * Helper: Set the maximum number of attempts.
 */
export async function setMaxAttempts(
  page: Page,
  maxAttempts: number,
): Promise<void> {
  const maxAttemptInput = getMaxAttemptsInput(page);
  await maxAttemptInput.clear();
  await maxAttemptInput.fill(maxAttempts.toString());
  await waitForTestPatchResponse(page);
  await maxAttemptInput.press("Enter");
}

/**
 * Helper: Set the test duration.
 */
export async function setDuration(page: Page, duration: number): Promise<void> {
  const durationInput = getDurationInput(page);
  await durationInput.click();
  await durationInput.fill(duration.toString());
  await waitForTestPatchResponse(page);
  await durationInput.press("Enter");
}

/**
 * Helper: Generic toggle function for any test setting.
 * Handles clicking a toggle and waiting for the PATCH response.
 * Automatically extracts testId from page URL.
 *
 * @param page - The Playwright page object
 * @param testIdSelector - The data-testid of the toggle element (e.g., "toggle-accepting-responses", "toggle-logged-in-only", "toggle-detailed-score", "toggle-correct-answers", "toggle-questions-ordered")
 * @param setState - Set to specific state (true or false). Only clicks if needed to reach the desired state.
 */
export async function toggleTestSetting(
  page: Page,
  testIdSelector: string,
  setState: boolean,
): Promise<void> {
  const toggle = page.getByTestId(testIdSelector);

  // Check current state and only click if needed
  const currentState = await toggle.evaluate((el) => {
    return (el as HTMLElement).getAttribute("aria-checked") === "true";
  });

  // Only click if the current state differs from desired state
  if (currentState !== setState) {
    await toggle.click();
  }
}

/**
 * Helper: Add a prerequisite to a test via UI.
 * Navigates to settings tab, clicks Add Prerequisite button, selects test by title, and confirms.
 */
export async function addPrerequisite(
  page: Page,
  testId: string,
  prerequisiteTestTitle: string,
  minScore: number = 0,
): Promise<void> {
  // Navigate to test settings
  await page.goto(`/en/test/${testId}`);
  await waitForLoaderToDisappear(page);

  // Click Settings tab
  await TestNavigateToTab(page, "settings");

  // Scroll to prerequisites section
  await page.getByTestId("section-prerequisites").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Click Add Prerequisite button
  const addButton = page.getByTestId("btn-add-prerequisite");
  await expect(async () => {
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
  }).toPass();
  await addButton.click();

  // Wait for dialog to appear
  await page
    .getByTestId("dialog-add-prerequisite")
    .waitFor({ state: "visible" });

  // Select the prerequisite test from dropdown
  const selectTrigger = page.getByTestId("select-prerequisite-test");
  await selectTrigger.click();

  // Click the option with the prerequisite test title
  const testOption = page.getByRole("option", { name: prerequisiteTestTitle });
  await expect(testOption).toBeVisible();
  await testOption.click();

  // Set minimum score if not 0
  if (minScore > 0) {
    const scoreInput = page
      .getByTestId("input-min-score")
      .locator('input[type="text"]');
    await scoreInput.click();
    await scoreInput.clear();
    await scoreInput.fill(minScore.toString());
  }

  // Click confirm/submit button in dialog
  const confirmButton = page.getByTestId("btn-confirm-prerequisite");
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();

  // Wait for success and dialog to close
  await waitForLoaderToDisappear(page);
  await page.waitForTimeout(200);
}
