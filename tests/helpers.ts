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
 * Helper: Complete an active test session by clicking the Finish button.
 */
export async function completeTest(page: Page): Promise<void> {
  const finishButton = page.getByRole("button", { name: "Finish" });
  await expect(async () => {
    await expect(finishButton).toBeVisible();
  }).toPass();
  await finishButton.click();
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
  const testId = testIdMatch ? testIdMatch[1] : null;

  // Update test title
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

  // Go to Settings tab and update configuration
  await navigateToSettingsTab(page);

  // Find the description input/textarea
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

  if (!acceptingResponses) {
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

  if (loggedInOnly) {
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

  if (maxAttempts !== null) {
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

  // Create a question
  await navigateToQuestionsTab(page);

  const addQuestionButtons = page.getByRole("button", {
    name: /add question/i,
  });
  await expect(async () => {
    await expect(addQuestionButtons).toHaveCount(1);
  }).toPass();
  await addQuestionButtons.nth(0).click();

  const questionCard = page.locator('[class*="shadow"]').filter({
    has: page.getByText(/question text/i),
  });
  await expect(async () => {
    await expect(questionCard).toBeVisible();
  }).toPass();

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
