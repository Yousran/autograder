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
  // Wait for finish button to appear (with extended timeout)
  const finishButton = page.getByRole("button", {
    name: /finish|submit|complete/i,
  });

  await expect(async () => {
    await expect(finishButton.first()).toBeVisible();
  }).toPass();

  await finishButton.first().click();
  await page.waitForTimeout(300);

  // Wait for confirmation button and click
  const confirmButton = page.getByRole("button", { name: /submit|confirm/i });

  await expect(async () => {
    await expect(confirmButton.first()).toBeEnabled();
    await confirmButton.first().click();
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
 * Helper: Create a test with a question from the home page and return its join code and test ID.
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

  return { joinCode, testId };
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
    .filter({ has: page.getByText(/max score/i) })
    .count();
}

/**
 * Helper: Get a specific question card by index (0-based).
 */
export function getQuestionCard(page: Page, questionIndex: number) {
  return page
    .locator('[class*="shadow"]')
    .filter({ has: page.getByText(/max score/i) })
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
  await navigateToSettingsTab(page);

  // Scroll to prerequisites section
  await page.locator("text=/prerequisite/i").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Click Add Prerequisite button
  const addButton = page.getByRole("button", { name: /add/i }).last();
  await expect(async () => {
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();
  }).toPass();
  await addButton.click();

  // Wait for dialog to appear
  await page.getByText(/select.*test/i).waitFor({ state: "visible" });

  // Select the prerequisite test from dropdown
  const selectTrigger = page.getByRole("combobox", {
    name: "Prerequisite Test",
  });
  await selectTrigger.click();

  // Click the option with the prerequisite test title
  const testOption = page.getByRole("option", { name: prerequisiteTestTitle });
  await expect(testOption).toBeVisible();
  await testOption.click();

  // Set minimum score if not 0
  if (minScore > 0) {
    const scoreInput = page
      .locator("label")
      .filter({ hasText: /min.*score/i })
      .locator("..")
      .locator("input")
      .first();
    await scoreInput.click();
    await scoreInput.clear();
    await scoreInput.fill(minScore.toString());
  }

  // Click confirm/submit button in dialog
  const confirmButton = page
    .getByRole("button", { name: /confirm|submit|add/i })
    .last();
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();

  // Wait for success and dialog to close
  await waitForLoaderToDisappear(page);
  await page.waitForTimeout(200);
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
  await submitJoinCode(page, joinCode);
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
 * Helper: Answer a question on the test page with a specific choice text.
 * Finds and clicks the choice that matches the given text.
 */
export async function answerQuestionWithChoice(
  page: Page,
  choiceText: string,
): Promise<void> {
  // Find labels with radio/checkbox inputs that contain the matching text
  const choiceLabel = page
    .locator("label")
    .filter({
      has: page.locator('input[type="radio"], input[type="checkbox"]'),
    })
    .filter({ hasText: choiceText });

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
    // First, find the currently visible question container
    // Look for the first visible element that contains the question content
    const visibleQuestionContainer = page
      .locator('[class*="shadow"], [role="group"]')
      .filter({
        hasNot: page.locator('[aria-disabled="true"]'),
      })
      .first();

    // Find all choice labels within the current question container that have radio/checkbox inputs
    // These are labels paired with input elements (radio or checkbox)
    const choiceLabels = page.locator("label").filter({
      has: page.locator('input[type="radio"], input[type="checkbox"]'),
    });

    // Get the count and validate index is valid
    const count = await choiceLabels.count();
    expect(count).toBeGreaterThan(choiceIndex);

    // Select the target choice by index
    const targetChoice = choiceLabels.nth(choiceIndex);
    await expect(targetChoice).toBeVisible();

    // Scroll into view before clicking
    await targetChoice.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // Click the label to select the radio/checkbox
    await targetChoice.click();
    await waitForLoaderToDisappear(page);
  }).toPass();
}

/**
 * Helper: Create a multiple choice question with specified choices and mark one as correct.
 * Assumes the question card is already visible.
 * Note: Choice questions have 2 default empty choices by default.
 */
export async function createChoiceQuestion(
  page: Page,
  questionIndex: number,
  options: {
    questionText: string;
    choices: string[];
    correctChoiceIndex: number;
  },
): Promise<void> {
  // Set question type to CHOICE
  await setQuestionType(page, questionIndex, "CHOICE");

  // Fill question text
  await fillQuestionText(page, questionIndex, options.questionText);

  // Add choices
  for (let i = 0; i < options.choices.length; i++) {
    // Add choice if needed (first 2 choices exist by default)
    if (i >= 2) {
      await addChoiceToQuestion(page, questionIndex);
    }

    // Fill choice text
    await fillChoiceText(page, questionIndex, i, options.choices[i]);
  }

  // Mark the correct choice
  await markChoiceAsCorrect(page, questionIndex, options.correctChoiceIndex);
}

/**
 * Helper: Create a test with a choice question and mark a correct answer.
 * Returns { joinCode, testId }
 */
export async function createTestWithScoringQuestion(
  page: Page,
  {
    title = "Test with Scoring",
    questionText = "Select the correct answer",
    choices = ["Correct Answer", "Wrong Answer 1", "Wrong Answer 2"],
    correctChoiceIndex = 0,
    description = "A test with a scoreable question",
  }: {
    title?: string;
    questionText?: string;
    choices?: string[];
    correctChoiceIndex?: number;
    description?: string;
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

  // Go to Settings tab
  await navigateToSettingsTab(page);

  // Update test description
  await updateTestDescription(page, description);

  // Navigate to Questions tab
  await navigateToQuestionsTab(page);

  // Add a question
  const qIndex = await addQuestion(page);

  // Create the multiple choice question
  await createChoiceQuestion(page, qIndex, {
    questionText,
    choices,
    correctChoiceIndex,
  });

  const joinCode = await getJoinCode(page);

  return { joinCode, testId };
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
  await submitJoinCode(page, joinCode);
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
