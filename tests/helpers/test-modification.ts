import { Browser, Page, expect } from "@playwright/test";
import { waitForLoaderToDisappear } from "./ui-interactions";
import { addQuestion } from "./question-modification";

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
  await updateTestTitle(page, title);

  // Go to Settings tab and update configuration
  await TestNavigateToTab(page, "settings");

  // Update test description
  await updateTestDescription(page, description);

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
 */
export async function TestNavigateToTab(
  page: Page,
  tabName: "questions" | "settings" | "participants",
): Promise<void> {
  let tab;
  switch (tabName) {
    case "questions":
      tab = page.getByTestId("tab-questions");
      break;
    case "settings":
      tab = page.getByTestId("tab-settings");
      break;
    case "participants":
      tab = page.getByTestId("tab-participants");
      break;
  }
  await tab.waitFor({ state: "visible" });
  await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
  await tab.click();
  await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
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

/**
 * Helper: Update the test title.
 */
export async function updateTestTitle(
  page: Page,
  title: string,
): Promise<void> {
  const titlePreview = page.getByTestId("test-title-preview");
  await titlePreview.hover();
  await titlePreview.click();

  const titleInput = page.getByTestId("test-title-input");
  await titleInput.waitFor({ state: "visible" });
  await titleInput.fill(title);
  await titleInput.press("Enter");

  await waitForTestPatchResponse(page);
}

/**
 * Helper: Update the test description.
 */
export async function updateTestDescription(
  page: Page,
  description: string,
): Promise<void> {
  const descriptionPreview = page.getByTestId("test-description-preview");
  await descriptionPreview.hover();
  await descriptionPreview.click();

  const descriptionInput = page.getByTestId("test-description-input");
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
  const maxAttemptInput = page
    .getByTestId("input-max-attempts")
    .locator('input[type="text"]');
  await maxAttemptInput.clear();
  await maxAttemptInput.fill(maxAttempts.toString());
  await waitForTestPatchResponse(page);
  await maxAttemptInput.press("Enter");
}

/**
 * Helper: Set the test duration.
 */
export async function setDuration(page: Page, duration: number): Promise<void> {
  const durationInput = page
    .getByTestId("input-duration")
    .locator('input[type="text"]');
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
