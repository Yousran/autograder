import { Browser, Page, expect } from "@playwright/test";

/**
 * Helper: Wait for loading spinner/overlay to disappear
 * Checks if a spinner or loading overlay exists and waits for it to be hidden
 */
export async function waitForLoaderToDisappear(page: Page): Promise<void> {
  const spinner = page.locator(
    '[role="progressbar"], .spinner, .loading, [class*="loader"]',
  );
  if (
    await spinner
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await spinner.first().waitFor({ state: "hidden" });
  }
}

/**
 * Helper: Create a new test as the authenticated user and return its ID.
 * Wraps the browser context creation and navigation in a retry block.
 */
export async function createNewTest(browser: Browser): Promise<string> {
  let testId = "";
  await expect(async () => {
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
    const match = url.match(/test\/([a-z0-9]+)/i);
    if (match) {
      testId = match[1];
    }

    await context.close();
  }).toPass();
  return testId;
}

/**
 * Helper: Click the Questions tab and wait for the panel to become active.
 */
export async function navigateToQuestionsTab(page: Page): Promise<void> {
  const questionsTab = page.getByRole("tab", { name: "Questions" });
  await questionsTab.waitFor({ state: "visible" });
  await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
  await questionsTab.click();
  await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
}

/**
 * Helper: Click the Settings tab and wait for the panel to become active.
 */
export async function navigateToSettingsTab(page: Page): Promise<void> {
  const settingsTab = page.getByRole("tab", { name: "Settings" });
  await settingsTab.waitFor({ state: "visible" });
  await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
  await settingsTab.click();
  await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
}

/**
 * Helper: Navigate to the profile page via the navbar user menu.
 */
export async function navigateToProfilePage(page: Page): Promise<void> {
  const userMenuButton = page.locator("header button").last();
  await userMenuButton.click();
  await waitForLoaderToDisappear(page);
  const profileMenuItem = page.locator("a[href*='/profile/']").first();
  await profileMenuItem.waitFor({ state: "visible" });
  await profileMenuItem.click();
  await waitForLoaderToDisappear(page);
  await page.waitForURL((url) => url.href.includes("/profile/"));
}

/**
 * Helper: Fill and submit the sign-up form.
 * The caller should navigate to the sign-up URL beforehand.
 */
export async function fillSignUpForm(
  page: Page,
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await page.locator("#name").fill(name);
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#confirmPassword").fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();
}

/**
 * Helper: Fill the join code input and click the Join button.
 */
export async function submitJoinCode(
  page: Page,
  joinCode: string,
): Promise<void> {
  const joinCodeInput = page.getByRole("textbox");
  const joinButton = page.getByRole("button", { name: /join/i });
  await joinCodeInput.fill(joinCode);
  await expect(joinButton).toBeEnabled();
  await joinButton.click();
}

/**
 * Helper: Get the join code from the test page.
 */
export async function getJoinCode(page: Page): Promise<string> {
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

/**
 * Helper: Complete an active test session by clicking the Finish button.
 */
export async function completeTest(page: Page): Promise<void> {
  await expect(async () => {
    const finishButton = page.getByRole("button", { name: "Finish" });
    await expect(finishButton).toBeVisible();
    await finishButton.click();

    const confirmButton = page.getByRole("button", { name: "Submit" });
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
  }).toPass();
}

/**
 * Helper: Update the test title.
 */
export async function updateTestTitle(
  page: Page,
  testId: string,
  title: string,
): Promise<void> {
  const titleElement = page.locator("text=/Untitled Test/");
  await titleElement.first().hover();
  await titleElement.first().click();

  const titleInput = page.locator('input[data-slot="editable-input"]');
  await titleInput.waitFor({ state: "visible" });
  await titleInput.fill(title);
  await titleInput.press("Enter");

  await page.waitForResponse(
    (response) =>
      response.url().includes(`/api/tests/${testId}`) &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );
}

/**
 * Helper: Update the test description.
 */
export async function updateTestDescription(
  page: Page,
  description: string,
): Promise<void> {
  const descriptionLabel = page
    .locator("label")
    .filter({ hasText: /description/i });
  const descriptionContainer = descriptionLabel.locator("..");
  const descriptionText = descriptionContainer.locator("p, div").first();
  await descriptionText.click();
  const descriptionInput = descriptionContainer
    .locator("textarea, input")
    .first();
  await descriptionInput.waitFor({ state: "visible" });
  await descriptionInput.fill(description);
  await descriptionInput.press("Enter");
}

/**
 * Helper: Toggle the "Accepting Responses" setting.
 */
export async function toggleAcceptingResponses(
  page: Page,
  testId: string,
): Promise<void> {
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
  await toggle.click();
  await responsePromise;
}

/**
 * Helper: Toggle the "Logged-in Users Only" setting.
 */
export async function toggleLoggedInOnly(
  page: Page,
  testId: string,
): Promise<void> {
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
  await toggle.click();
  await responsePromise;
}

/**
 * Helper: Set the maximum number of attempts.
 */
export async function setMaxAttempts(
  page: Page,
  maxAttempts: number,
): Promise<void> {
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

/**
 * Helper: Set the test duration.
 */
export async function setDuration(page: Page, duration: number): Promise<void> {
  const durationLabel = page
    .locator("label")
    .filter({ hasText: /duration|time limit/i });
  const durationContainer = durationLabel.locator("..");
  const durationInput = durationContainer.locator("input").first();
  await durationInput.click();
  await durationInput.clear();
  await durationInput.fill(duration.toString());
  await durationInput.press("Enter");
}

/**
 * Helper: Toggle the "Randomize Questions" setting.
 */
export async function toggleRandomizeQuestions(
  page: Page,
  testId: string,
): Promise<void> {
  const randomizeToggle = page
    .getByText("Randomize", { exact: false })
    .locator("..")
    .locator("..")
    .getByRole("switch");

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/tests/${testId}`) &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );
  await randomizeToggle.click();
  await responsePromise;
}

/**
 * Helper: Toggle the "Show Detailed Score" setting.
 */
export async function toggleShowDetailedScore(
  page: Page,
  testId: string,
): Promise<void> {
  const toggle = page
    .getByText("Show Detailed Score", { exact: false })
    .locator("..")
    .locator("..")
    .getByRole("switch");

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/tests/${testId}`) &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );
  await toggle.click();
  await responsePromise;
}

/**
 * Helper: Toggle the "Show Correct Answers" setting.
 */
export async function toggleShowCorrectAnswers(
  page: Page,
  testId: string,
): Promise<void> {
  const toggle = page
    .getByText("Show Correct Answers", { exact: false })
    .locator("..")
    .locator("..")
    .getByRole("switch");

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/tests/${testId}`) &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );
  await toggle.click();
  await responsePromise;
}

/**
 * Helper: Toggle the "Ordered Questions" setting.
 */
export async function toggleOrderedQuestions(
  page: Page,
  testId: string,
): Promise<void> {
  const toggle = page
    .getByText("Ordered Questions", { exact: false })
    .locator("..")
    .locator("..")
    .getByRole("switch");

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/api/tests/${testId}`) &&
      response.request().method() === "PATCH" &&
      response.status() === 200,
  );
  await toggle.click();
  await responsePromise;
}

/**
 * Helper: Create a test with a question from the home page and return its join code.
 */
export async function createTestWithQuestion(
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
  await page.goto("/en");

  const createButton = page.getByRole("button", { name: "Create New Test" });
  await createButton.waitFor({ state: "visible" });
  await createButton.click();

  await page.waitForURL(/\/en\/test\/[a-z0-9]+/i);

  const url = page.url();
  const testIdMatch = url.match(/test\/([a-z0-9]+)/i);
  const testId = testIdMatch ? testIdMatch[1] : "";

  // Update test title
  await updateTestTitle(page, testId, title);

  // Go to Settings tab and update configuration
  await navigateToSettingsTab(page);

  // Update test description
  await updateTestDescription(page, description);

  if (!acceptingResponses) {
    await toggleAcceptingResponses(page, testId);
  }

  if (loggedInOnly) {
    await toggleLoggedInOnly(page, testId);
  }

  if (maxAttempts !== null) {
    await setMaxAttempts(page, maxAttempts);
  }

  // Create a question
  await navigateToQuestionsTab(page);

  await addQuestion(page);

  const joinCode = await getJoinCode(page);

  return joinCode;
}

/**
 * Helper: Create a test with multiple questions and return its join code and test ID.
 */
export async function createTestWithMultipleQuestions(
  page: Page,
  {
    title = "Multi-Question Test",
    questionCount = 3,
    duration = null,
    randomizeQuestions = false,
    description = "A test with multiple questions",
    maxAttempts = null,
  }: {
    title?: string;
    questionCount?: number;
    duration?: number | null;
    randomizeQuestions?: boolean;
    description?: string;
    maxAttempts?: number | null;
  } = {},
): Promise<{ joinCode: string; testId: string }> {
  await page.goto("/en");

  const createButton = page.getByRole("button", { name: "Create New Test" });
  await createButton.waitFor({ state: "visible" });
  await createButton.click();

  await page.waitForURL(/\/en\/test\/[a-z0-9]+/i);

  const url = page.url();
  const testIdMatch = url.match(/test\/([a-z0-9]+)/i);
  const testId = testIdMatch ? testIdMatch[1] : "";

  // Update test title
  await updateTestTitle(page, testId, title);

  // Go to Settings tab and update configuration
  await navigateToSettingsTab(page);

  // Update test description
  await updateTestDescription(page, description);

  // Set duration if provided
  if (duration !== null) {
    await setDuration(page, duration);
  }

  // Set randomize questions if requested
  if (randomizeQuestions) {
    await toggleRandomizeQuestions(page, testId);
  }

  // Set max attempts if provided
  if (maxAttempts !== null) {
    await setMaxAttempts(page, maxAttempts);
  }

  // Create multiple questions
  await navigateToQuestionsTab(page);

  for (let i = 0; i < questionCount; i++) {
    await addQuestion(page);
  }

  const joinCode = await getJoinCode(page);

  return { joinCode, testId };
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
    const choiceOption = page
      .locator("label")
      .filter({ hasText: /option/i })
      .first();
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
 * Helper: Add a new question to the test.
 * Returns the 0-based index of the newly created question.
 */
export async function addQuestion(page: Page): Promise<number> {
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

  return existingCount;
}

/**
 * Helper: Get the number of questions in the current test.
 */
export async function getQuestionCount(page: Page): Promise<number> {
  return page
    .locator('[class*="shadow"]')
    .filter({ has: page.getByText(/question text/i) })
    .count();
}

/**
 * Helper: Get a specific question card by index (0-based).
 */
export function getQuestionCard(page: Page, questionIndex: number) {
  return page
    .locator('[class*="shadow"]')
    .filter({ has: page.getByText(/question text/i) })
    .nth(questionIndex);
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
 * Helper: Fill the question text for a specific question.
 */
export async function fillQuestionText(
  page: Page,
  questionIndex: number,
  text: string,
): Promise<void> {
  const questionTextarea = page
    .getByRole("textbox")
    .filter({ hasText: /question text|enter question/i })
    .nth(questionIndex);

  await expect(async () => {
    await questionTextarea.click();
    await questionTextarea.fill(text);
    await page.click("body");
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
