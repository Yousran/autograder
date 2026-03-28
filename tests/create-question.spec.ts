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
import { createTest, TestNavigateToTab } from "./helpers/test-modification";
import {
  addQuestion,
  setQuestionType,
  addChoiceToQuestion,
  fillQuestionText,
  fillQuestionAnswer,
  getQuestionCard,
  getQuestionCount,
  getChoiceCount,
  fillChoiceText,
} from "./helpers/question-modification";
// import { waitForLoaderToDisappear } from "./helpers/ui-interactions";

// ─────────────────────────────────────────────────────────────────────────
// Create First Question - Two Test Scenarios
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Create First Question - At End", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const result = await createTest(browser, { title: "First Question Test" });
    testId = result.testId;
  });

  test("creates the first question at the end of the Questions tab", async ({
    page,
  }) => {
    await page.goto(`/en/test/${testId}`);

    await expect(async () => {
      await TestNavigateToTab(page, "questions");

      // Initially there should be no questions, so only one "Add Question" button at bottom
      const addQuestionButtons = page.getByRole("button", {
        name: /add question/i,
      });
      await expect(addQuestionButtons).toHaveCount(1);

      // Click the "Add Question" button (visible at the end when no questions exist)
      await addQuestion(page);
    }).toPass();

    // Verify question card appears with default props
    await expect(async () => {
      const questionCard = getQuestionCard(page, 0);
      await expect(questionCard).toBeVisible();

      // Verify the type selector shows default type (CHOICE)
      const typeSelect = page.getByTestId("select-question-type");
      await expect(typeSelect).toBeVisible();
    }).toPass();
  });
});

test.describe.serial("Create Question", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const result = await createTest(browser, { title: "Create Question Test" });
    testId = result.testId;
  });

  test("shows the add button when first opening the questions tab", async ({
    page,
  }) => {
    await page.goto(`/en/test/${testId}`);

    await expect(async () => {
      await TestNavigateToTab(page, "questions");

      // Click to create the first question
      await addQuestion(page);
    }).toPass();

    // Verify the question is created
    await page.reload();
    await expect(async () => {
      const count = await getQuestionCount(page);
      expect(count).toBe(1);
    }).toPass();
  });

  test("creates a new question at the end of the list", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await expect(async () => {
      await TestNavigateToTab(page, "questions");

      // Verify there is 1 question
      const count = await getQuestionCount(page);
      expect(count).toBe(1);

      // Click the "Add Question" button at the very end
      await addQuestion(page);
    }).toPass();

    // Verify the question count is now 2
    await page.reload();
    await expect(async () => {
      const count = await getQuestionCount(page);
      expect(count).toBe(2);
    }).toPass();
  });

  test("inserts a new question between two existing questions", async ({
    page,
  }) => {
    await page.goto(`/en/test/${testId}`);

    await expect(async () => {
      await TestNavigateToTab(page, "questions");

      // Wait for the question cards to appear to ensure the tab has actually switched
      const count = await getQuestionCount(page);
      expect(count).toBe(2);

      // Now the dividers will exist in the DOM
      const middleDivider = page.locator(".group\\/add").nth(0);

      // Hover and wait for the specific button to become visible (handling your 200ms transition)
      await middleDivider.hover();
      const addButton = middleDivider.getByRole("button", {
        name: /add question/i,
      });

      await expect(addButton).toBeVisible();
      await addButton.click();
    }).toPass();

    // Verify there are now 3 questions
    await page.reload();
    await expect(async () => {
      const count = await getQuestionCount(page);
      expect(count).toBe(3);
    }).toPass();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Create Essay Question
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Create Essay Question", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const result = await createTest(browser, { title: "Essay Question Test" });
    testId = result.testId;
  });

  test("creates and configures an essay question", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await expect(async () => {
      await TestNavigateToTab(page, "questions");

      // The add button should be visible and always show (alwaysVisible=true)
      const addButton = page.getByRole("button", { name: /add question/i });
      await expect(addButton).toBeVisible();

      await addQuestion(page);

      // Verify question is created
      const questionCard = getQuestionCard(page, 0);
      await expect(questionCard).toBeVisible();

      // Change question type to ESSAY
      await setQuestionType(page, 0, "ESSAY");
    }).toPass();

    // Verify essay-specific UI appears
    await expect(async () => {
      await expect(page.getByText(/expected answer/i)).toBeVisible();
      await expect(page.getByText(/answer matching/i)).toBeVisible();
      await expect(page.getByText(/max score/i)).toBeVisible();
    }).toPass();
  });

  test("updates essay question answer text", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await expect(async () => {
      await TestNavigateToTab(page, "questions");

      const count = await getQuestionCount(page);
      expect(count).toBe(1);

      // Fill the question text
      await fillQuestionText(page, 0, "What is the capital of France?");

      // Fill the answer text
      await fillQuestionAnswer(page, 0, "Paris");
    }).toPass();

    // Verify the answer was saved by reloading
    await expect(async () => {
      await page.reload();
      await TestNavigateToTab(page, "questions");
      const answerTextarea = page
        .locator('textarea[placeholder*="answer"], textarea[id="answer"]')
        .nth(0);
      await expect(answerTextarea).toHaveValue("Paris");
    }).toPass();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Create Choice Question
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Create Choice Question", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const result = await createTest(browser, { title: "Choice Question Test" });
    testId = result.testId;
  });

  test("creates a choice question with default type", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await expect(async () => {
      await TestNavigateToTab(page, "questions");

      // The add button should be visible and always show (alwaysVisible=true)
      const addButton = page.getByRole("button", { name: /add question/i });
      await expect(addButton).toBeVisible();

      await addQuestion(page);

      // Verify question is created with choice-specific UI
      await expect(getQuestionCard(page, 0)).toBeVisible();
      await expect(
        page.getByText(/choice randomized|randomize/i).nth(0),
      ).toBeVisible();
      await expect(page.getByText(/max score/i)).toBeVisible();
    }).toPass();
  });

  test("adds choice options to a single-select question", async ({ page }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "questions");

    await expect(async () => {
      // Verify question is created
      const questionCard = getQuestionCard(page, 0);
      await expect(questionCard).toBeVisible();

      // Verify a choice item appears
      expect(await getChoiceCount(page, 0)).toBe(3);
    }).toPass();

    await expect(async () => {
      await addChoiceToQuestion(page, 0);
      await fillChoiceText(page, 0, 3, "New Choice Option");
      expect(await getChoiceCount(page, 0)).toBe(4);
    }).toPass();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Create Multiple Choice Question
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Create Multiple Choice Question", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const result = await createTest(browser, {
      title: "Multiple Choice Question Test",
    });
    testId = result.testId;
  });

  test("creates and changes question to multiple choice type", async ({
    page,
  }) => {
    await page.goto(`/en/test/${testId}`);

    await expect(async () => {
      await TestNavigateToTab(page, "questions");

      // The add button should be visible and always show (alwaysVisible=true)
      const addButton = page.getByRole("button", { name: /add question/i });
      await expect(addButton).toBeVisible();

      await addQuestion(page);

      // Verify question is created
      const questionCard = getQuestionCard(page, 0);
      await expect(questionCard).toBeVisible();

      // Change type to MULTIPLE_SELECT
      await setQuestionType(page, 0, "MULTIPLE_SELECT");
    }).toPass();

    // Verify multiple choice UI appears
    await expect(async () => {
      await expect(
        page.getByText(/choice randomized|randomize.*choice/i),
      ).toBeVisible();
      await expect(page.getByText(/max score/i)).toBeVisible();
    }).toPass();
  });

  test("adds multiple correct options to a multiple choice question", async ({
    page,
  }) => {
    await page.goto(`/en/test/${testId}`);

    await TestNavigateToTab(page, "questions");

    await expect(async () => {
      // Verify question is created
      const questionCard = getQuestionCard(page, 0);
      await expect(questionCard).toBeVisible();

      // Verify a choice item appears
      expect(await getChoiceCount(page, 0)).toBe(2);
    }).toPass();

    await expect(async () => {
      await addChoiceToQuestion(page, 0);
      await fillChoiceText(page, 0, 2, "New Choice Option");
      expect(await getChoiceCount(page, 0)).toBe(3);
    }).toPass();
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
