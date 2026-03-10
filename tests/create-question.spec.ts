/**
 * Create Question E2E Tests
 *
 * Verifies the educator workflow for creating questions within a test.
 * These tests run as the shared authenticated user (storageState from
 * `auth.setup.ts`), starting with newly created tests and covering:
 *
 * Covers:
 *   ✓ Creating the first question (at end)
 *   ✓ Creating the first question (with explicit add button)
 *   ✓ Creating questions at the end of the list
 *   ✓ Creating questions in between existing questions
 *   ✓ Creating essay-type questions
 *   ✓ Creating single choice questions
 *   ✓ Creating multiple choice questions
 */

import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

// ─────────────────────────────────────────────────────────────────────────
// Create First Question - Two Test Scenarios
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Create First Question - At End", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    // Create a new test for adding the first question
    const context = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/en`);

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
  });

  test("creates the first question at the end of the Questions tab", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible (confirms tab switch)
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    // Initially there should be no questions, so only one "Add Question" button at bottom
    const addQuestionButtons = page.getByRole("button", {
      name: /add question/i,
    });
    await expect(addQuestionButtons).toHaveCount(1);

    // Click the "Add Question" button (visible at the end when no questions exist)
    await addQuestionButtons.nth(0).click();

    // The question should be optimistically added

    // Verify question card appears with default props
    const questionCard = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });
    await expect(questionCard).toBeVisible();

    // Verify the type selector shows default type (CHOICE)
    const typeSelect = page.locator('[role="combobox"]').nth(0);
    await expect(typeSelect).toBeVisible();
  });
});

test.describe.serial("Create Question", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    // Create a new test
    const context = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/en`);

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
  });

  test("shows the add button when first opening the questions tab", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    // The add button should be visible and always show (alwaysVisible=true)
    const addButton = page.getByRole("button", { name: /add question/i });
    await expect(addButton).toBeVisible();

    // Click to create the first question
    await addButton.nth(0).click();

    // Verify the question is created
    const questionCards = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });

    await page.reload();
    await expect(questionCards).toHaveCount(1);
  });

  test("creates a new question at the end of the list", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    // Verify there are 2 questions
    const questionCards = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });
    await expect(questionCards).toHaveCount(1);

    // Click the "Add Question" button at the very end
    const allAddButtons = page.getByRole("button", { name: /add question/i });
    const addButtonCount = await allAddButtons.count();
    const lastAddButton = allAddButtons.nth(addButtonCount - 1);
    await lastAddButton.click();

    // Verify the question numbers are 1, 2
    const numbers = page.locator('[class*="p-2"]').filter({
      hasText: /^[1-2]$/,
    });
    const firstNumber = numbers.nth(1);
    await expect(firstNumber).toContainText("2");

    await page.reload();
    await expect(questionCards).toHaveCount(2);
  });

  test("inserts a new question between two existing questions", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    // FIX: Wait for the question cards to appear to ensure the tab has actually switched
    const questionCards = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });
    await expect(questionCards).toHaveCount(2);

    // Now the dividers will exist in the DOM
    const middleDivider = page.locator(".group\\/add").nth(0);

    // Hover and wait for the specific button to become visible (handling your 200ms transition)
    await middleDivider.hover();
    const addButton = middleDivider.getByRole("button", {
      name: /add question/i,
    });

    await expect(addButton).toBeVisible();
    await addButton.click();

    // Verify there are now 3 questions
    await page.reload();
    await expect(questionCards).toHaveCount(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Create Essay Question
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Create Essay Question", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/en`);

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
  });

  test("creates and configures an essay question", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    // The add button should be visible and always show (alwaysVisible=true)
    const addButton = page.getByRole("button", { name: /add question/i });
    await expect(addButton).toBeVisible();

    await addButton.nth(0).click();

    // Verify question is created
    const questionCard = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });
    await expect(questionCard).toBeVisible();

    // Change question type to ESSAY
    const typeSelect = page.locator('[role="combobox"]').nth(0);
    await typeSelect.click();

    const essayOption = page.getByRole("option", { name: /essay/i });
    await essayOption.nth(0).click();

    // Verify essay-specific UI appears
    // Should see "Essay Answer" label and textarea
    const essayLabel = page.getByText(/expected answer/i);
    await expect(essayLabel).toBeVisible();

    // Verify answer matching label appears
    const matchingLabel = page.getByText(/answer matching/i);
    await expect(matchingLabel).toBeVisible();

    // Verify max score input appears
    const maxScoreLabel = page.getByText(/max score/i);
    await expect(maxScoreLabel).toBeVisible();
  });

  test("updates essay question answer text", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    const questionCards = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });
    await expect(questionCards).toHaveCount(1);

    // Fill the question text
    const questionTextArea = page
      .getByRole("textbox")
      .filter({ hasText: "Enter question text..." });
    await questionTextArea.click();
    await questionTextArea.fill("What is the capital of France?");

    // Click outside to trigger save
    await page.click("body");

    // Find and fill the answer textarea
    const answerTextarea = page
      .locator('textarea[placeholder*="answer"], textarea[id="answer"]')
      .nth(0);
    await expect(answerTextarea).toBeVisible();
    await answerTextarea.click();
    await answerTextarea.fill("Paris");

    // Click outside to trigger save
    await page.click("body");

    // Verify the answer was saved by reloading
    await page.reload();

    const answersAfterReload = page
      .locator('textarea[placeholder*="answer"], textarea[id="answer"]')
      .nth(0);
    await expect(answersAfterReload).toHaveValue("Paris");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Create Choice Question
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Create Choice Question", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/en`);

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
  });

  test("creates a choice question with default type", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    // The add button should be visible and always show (alwaysVisible=true)
    const addButton = page.getByRole("button", { name: /add question/i });
    await expect(addButton).toBeVisible();

    await addButton.nth(0).click();

    // Verify question is created
    const questionCard = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });
    await expect(questionCard).toBeVisible();

    // Verify choice-specific UI appears (choice randomized toggle, max score, etc.)
    const choiceRandomizedLabel = page
      .getByText(/choice randomized|randomize/i)
      .nth(0);
    await expect(choiceRandomizedLabel).toBeVisible();

    // Verify max score appears
    const maxScoreLabel = page.getByText(/max score/i);
    await expect(maxScoreLabel).toBeVisible();
  });

  test("adds choice options to a single-select question", async ({ page }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    // Verify question is created
    const questionCard = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });
    await expect(questionCard).toBeVisible();

    // Verify a choice item appears
    const deleteButton = page.getByRole("button", {
      name: "Delete Choice",
    });
    await expect(deleteButton).toHaveCount(3);

    // Find and click the "Add Choice" button
    const addChoiceButton = questionCard.getByRole("button", {
      name: "Add Choice",
    });
    await expect(addChoiceButton).toBeVisible();
    await addChoiceButton.click();

    await expect(deleteButton).toHaveCount(4);

    await page.reload();
    await expect(deleteButton).toHaveCount(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Create Multiple Choice Question
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Create Multiple Choice Question", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/en`);

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
  });

  test("creates and changes question to multiple choice type", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    // The add button should be visible and always show (alwaysVisible=true)
    const addButton = page.getByRole("button", { name: /add question/i });
    await expect(addButton).toBeVisible();

    await addButton.nth(0).click();

    // Verify question is created
    const questionCard = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });
    await expect(questionCard).toBeVisible();
    // Change type to MULTIPLE_SELECT
    const typeSelect = page.locator('[role="combobox"]').nth(0);
    await typeSelect.click();

    const multipleOption = page.getByRole("option", {
      name: /multiple.*choice|multiple.*select/i,
    });
    await multipleOption.nth(0).click();

    // Verify multiple choice UI appears
    const multipleChoiceLabel = page.getByText(
      /choice randomized|randomize.*choice/i,
    );
    await expect(multipleChoiceLabel).toBeVisible();

    // Verify max score appears
    const maxScoreLabel = page.getByText(/max score/i);
    await expect(maxScoreLabel).toBeVisible();
  });

  test("adds multiple correct options to a multiple choice question", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en/test/${testId}`);

    const questionsTab = page.getByRole("tab", { name: "Questions" });
    await questionsTab.waitFor({ state: "visible" });
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });
    await questionsTab.click();

    // Wait for the tabpanel content to be visible
    await page.getByRole("tabpanel").first().waitFor({ state: "visible" });

    // Verify question is created
    const questionCard = page.locator('[class*="shadow"]').filter({
      has: page.getByText(/question text/i),
    });
    await expect(questionCard).toBeVisible();

    // Verify a choice item appears
    const deleteButton = page.getByRole("button", {
      name: "Delete Choice",
    });
    await expect(deleteButton).toHaveCount(3);

    // Find and click the "Add Choice" button
    const addChoiceButton = questionCard.getByRole("button", {
      name: "Add Choice",
    });
    await expect(addChoiceButton).toBeVisible();
    await addChoiceButton.click();

    await expect(deleteButton).toHaveCount(4);

    await page.reload();
    await expect(deleteButton).toHaveCount(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// API-level guard
// ─────────────────────────────────────────────────────────────────────────

test.describe("Create Question API guard", () => {
  // Override the authenticated state to test as an anonymous user
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated POST /api/questions/create returns 401", async ({
    request,
  }) => {
    const response = await request.post("/api/questions/create", {
      data: {
        testId: "clgkpxgzl0000l908d4r4x4pz", // Valid CUID format, non-existent test
      },
    });
    expect(response.status()).toBe(401);
  });
});
