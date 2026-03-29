/**
 * Reorder Question E2E Tests
 *
 * Verifies the educator workflow for reordering questions within a test.
 * These tests run as the shared authenticated user (storageState from
 * `auth.setup.ts`), testing the ability to drag and drop questions
 * to change their order.
 *
 * Covers:
 *   ✓ Reordering questions by dragging to a new position
 *   ✓ Verifying question order is updated after reordering
 *   ✓ Reordering first question to last position
 *   ✓ Reordering middle question to different positions
 *   ✓ Reordering multiple times in succession
 */

import { test, expect, Page } from "@playwright/test";
import { createTest, TestNavigateToTab } from "./helpers/test-modification";
import {
  addQuestion,
  getQuestionCount,
  getQuestionOrder,
  getQuestionTextArea,
  reorderQuestions,
} from "./helpers/question-modification";
import { waitForSkeletonToDisappear } from "./helpers/ui-interactions";

/**
 * Helper: Get both the order and text of a question at a specific index
 */
async function getQuestionOrderAndText(
  page: Page,
  questionIndex: number,
): Promise<{ order: string; text: string }> {
  const order = await getQuestionOrder(page, questionIndex);

  // Get the editor element using the helper, then extract text from contenteditable
  const questionTextArea = getQuestionTextArea(page, questionIndex);
  const editableElement = questionTextArea.locator(
    '[data-slate-string="true"]',
  );
  const textContent = await editableElement.innerText();

  return { order, text: textContent.trim() };
}

// ─────────────────────────────────────────────────────────────────────────
// Reorder Questions - Test Scenarios
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Reorder Questions", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  let testId: string;

  test.beforeAll(async ({ browser }) => {
    const result = await createTest(browser);
    testId = result.testId;
  });

  test("can move first question to the end", async ({ page }) => {
    // Navigate to questions tab
    await page.goto(`/en/test/${testId}`);
    await TestNavigateToTab(page, "questions");
    await waitForSkeletonToDisappear(page);

    // Create 4 sample questions
    const q1Index = await addQuestion(page, {
      questionText: "First question",
      type: "CHOICE",
      choices: ["Q1 Choice 1", "Q1 Choice 2"],
      correctChoiceIndex: 0,
    });
    expect(q1Index).toBe(0);

    const q2Index = await addQuestion(page, {
      questionText: "Second question",
      type: "CHOICE",
      choices: ["Q2 Choice 1", "Q2 Choice 2"],
      correctChoiceIndex: 0,
    });
    expect(q2Index).toBe(1);

    const q3Index = await addQuestion(page, {
      questionText: "Third question",
      type: "ESSAY",
      answer: "Sample answer",
    });
    expect(q3Index).toBe(2);

    const q4Index = await addQuestion(page, {
      questionText: "Fourth question",
      type: "CHOICE",
      choices: ["Q4 Choice 1", "Q4 Choice 2"],
      correctChoiceIndex: 0,
    });
    expect(q4Index).toBe(3);

    // Get initial order and text mappings
    const initialOrder: { order: string; text: string }[] = [];
    for (let i = 0; i < 4; i++) {
      initialOrder.push(await getQuestionOrderAndText(page, i));
    }
    expect(initialOrder[0].text).toBe("First question");
    expect(initialOrder[1].text).toBe("Second question");
    expect(initialOrder[2].text).toBe("Third question");
    expect(initialOrder[3].text).toBe("Fourth question");

    // Reorder: move first question (index 0) to the end (position 3)
    await reorderQuestions(page, 0, 3);

    // Wait for the reordering to take effect in the UI
    await expect(async () => {
      const firstQuestionText = await getQuestionOrderAndText(page, 0);
      expect(firstQuestionText.text).toBe("Second question");
    }).toPass();

    // Verify new positions by checking text + order
    const finalOrder: { order: string; text: string }[] = [];
    for (let i = 0; i < 4; i++) {
      finalOrder.push(await getQuestionOrderAndText(page, i));
    }

    // After moving first question to end:
    // Position 0: Second question (order 1)
    // Position 1: Third question (order 2)
    // Position 2: Fourth question (order 3)
    // Position 3: First question (order 4)
    expect(finalOrder[0].text).toBe("Second question");
    expect(finalOrder[0].order).toBe("1");
    expect(finalOrder[1].text).toBe("Third question");
    expect(finalOrder[1].order).toBe("2");
    expect(finalOrder[2].text).toBe("Fourth question");
    expect(finalOrder[2].order).toBe("3");
    expect(finalOrder[3].text).toBe("First question");
    expect(finalOrder[3].order).toBe("4");
  });

  test("can move last question to the beginning", async ({ page }) => {
    // Navigate to questions tab
    await page.goto(`/en/test/${testId}`);
    await TestNavigateToTab(page, "questions");
    await waitForSkeletonToDisappear(page);

    // Get current question count
    const count = await getQuestionCount(page);
    expect(count).toBeGreaterThanOrEqual(4);

    // Store all question order and text before reordering
    const beforeReorder: { order: string; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      beforeReorder.push(await getQuestionOrderAndText(page, i));
    }

    // Get the index of the last question
    const lastQuestionIndex = count - 1;
    const lastQuestionData = beforeReorder[lastQuestionIndex];

    // Reorder: move last question to the beginning (position 0)
    await reorderQuestions(page, lastQuestionIndex, 0);

    // Wait for the reordering to take effect in the UI
    await expect(async () => {
      const firstQuestionText = await getQuestionOrderAndText(page, 0);
      expect(firstQuestionText.text).toBe(lastQuestionData.text);
    }).toPass();

    // Verify final positions by checking text + order
    const afterReorder: { order: string; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      afterReorder.push(await getQuestionOrderAndText(page, i));
    }

    // After moving last question to beginning:
    // Position 0: Last question (order 1)
    // Position 1: First question (order 2)
    // etc.
    expect(afterReorder[0].text).toBe(lastQuestionData.text);
    expect(afterReorder[0].order).toBe("1");
    expect(afterReorder[1].text).toBe(beforeReorder[0].text);
    expect(afterReorder[1].order).toBe("2");
  });

  test("can move middle question to a different position", async ({ page }) => {
    // Navigate to questions tab
    await page.goto(`/en/test/${testId}`);
    await TestNavigateToTab(page, "questions");
    await waitForSkeletonToDisappear(page);

    // Get current question count
    const count = await getQuestionCount(page);
    expect(count).toBeGreaterThanOrEqual(3);

    // Get the middle index
    const middleIndex = Math.floor(count / 2);

    // Store all question order and text before reordering
    const beforeReorder: { order: string; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      beforeReorder.push(await getQuestionOrderAndText(page, i));
    }

    const middleQuestionData = beforeReorder[middleIndex];

    // Reorder: move middle question to position 1
    await reorderQuestions(page, middleIndex, 1);

    // Wait for the reordering to take effect in the UI
    await expect(async () => {
      const movedQuestionText = await getQuestionOrderAndText(page, 1);
      expect(movedQuestionText.text).toBe(middleQuestionData.text);
    }).toPass();

    // Verify final positions by checking text + order
    const afterReorder: { order: string; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      afterReorder.push(await getQuestionOrderAndText(page, i));
    }

    // After moving middle question to position 1:
    // Position 1: Middle question (order 2)
    expect(afterReorder[1].text).toBe(middleQuestionData.text);
    expect(afterReorder[1].order).toBe("2");

    // Verify all questions are still accounted for (same count)
    expect(afterReorder.length).toBe(beforeReorder.length);

    // Verify the lists are different (reordering happened)
    const beforeTexts = beforeReorder.map((q) => q.text);
    const afterTexts = afterReorder.map((q) => q.text);
    expect(afterTexts).not.toEqual(beforeTexts);
  });

  test("can reorder questions multiple times in succession", async ({
    page,
  }) => {
    // Navigate to questions tab
    await page.goto(`/en/test/${testId}`);
    await TestNavigateToTab(page, "questions");
    await waitForSkeletonToDisappear(page);

    // Get current question count
    const count = await getQuestionCount(page);
    expect(count).toBeGreaterThanOrEqual(3);

    // Store initial order and text for all questions
    const initial: { order: string; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      initial.push(await getQuestionOrderAndText(page, i));
    }

    // First reorder: move question at index 0 to index 1
    await reorderQuestions(page, 0, 1);

    // Wait for the reordering to take effect
    await expect(async () => {
      const firstPositionText = await getQuestionOrderAndText(page, 0);
      expect(firstPositionText.text).toBe(initial[1].text);
    }).toPass();

    const afterFirst: { order: string; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      afterFirst.push(await getQuestionOrderAndText(page, i));
    }

    // Verify first question moved to position 1
    expect(afterFirst[0].text).toBe(initial[1].text);
    expect(afterFirst[0].order).toBe("1");
    expect(afterFirst[1].text).toBe(initial[0].text);
    expect(afterFirst[1].order).toBe("2");

    // Second reorder: move question at index 1 back to index 0
    await reorderQuestions(page, 1, 0);

    // Wait for the reordering to take effect
    await expect(async () => {
      const firstPositionText = await getQuestionOrderAndText(page, 0);
      expect(firstPositionText.text).toBe(initial[0].text);
    }).toPass();

    const afterSecond: { order: string; text: string }[] = [];
    for (let i = 0; i < count; i++) {
      afterSecond.push(await getQuestionOrderAndText(page, i));
    }

    // Verify back to original order at first two positions
    expect(afterSecond[0].text).toBe(initial[0].text);
    expect(afterSecond[0].order).toBe("1");
    expect(afterSecond[1].text).toBe(initial[1].text);
    expect(afterSecond[1].order).toBe("2");

    // Third reorder: move last question to the beginning
    if (count > 2) {
      await reorderQuestions(page, count - 1, 0);

      // Wait for the reordering to take effect
      await expect(async () => {
        const firstPositionText = await getQuestionOrderAndText(page, 0);
        expect(firstPositionText.text).toBe(initial[count - 1].text);
      }).toPass();

      const afterThird: { order: string; text: string }[] = [];
      for (let i = 0; i < count; i++) {
        afterThird.push(await getQuestionOrderAndText(page, i));
      }

      // Verify last question is now first
      expect(afterThird[0].text).toBe(initial[count - 1].text);
      expect(afterThird[0].order).toBe("1");
    }

    // Verify all questions are still accounted for
    const finalCount = await getQuestionCount(page);
    expect(finalCount).toBe(count);
  });

  test("can reorder between different question types", async ({
    page,
    browser,
  }) => {
    // Create a fresh test with controlled question types
    const newTestResult = await createTest(browser);
    const newTestId = newTestResult.testId;

    await page.goto(`/en/test/${newTestId}`);
    await TestNavigateToTab(page, "questions");
    await waitForSkeletonToDisappear(page);

    // Create questions of different types
    const essayIndex = await addQuestion(page, {
      questionText: "Essay question",
      type: "ESSAY",
      answer: "Essay answer",
    });
    expect(essayIndex).toBe(0);

    const choiceIndex = await addQuestion(page, {
      questionText: "Choice question",
      type: "CHOICE",
      choices: ["Choice 1", "Choice 2"],
      correctChoiceIndex: 0,
    });
    expect(choiceIndex).toBe(1);

    const multipleSelectIndex = await addQuestion(page, {
      questionText: "Multiple select question",
      type: "MULTIPLE_SELECT",
      choices: ["Option 1", "Option 2", "Option 3"],
      correctChoiceIndex: 0,
    });
    expect(multipleSelectIndex).toBe(2);

    // Store initial order and text
    const initial: { order: string; text: string }[] = [];
    for (let i = 0; i < 3; i++) {
      initial.push(await getQuestionOrderAndText(page, i));
    }

    expect(initial[0].text).toBe("Essay question");
    expect(initial[0].order).toBe("1");
    expect(initial[1].text).toBe("Choice question");
    expect(initial[1].order).toBe("2");
    expect(initial[2].text).toBe("Multiple select question");
    expect(initial[2].order).toBe("3");

    // Reorder: move essay question (index 0) to the end (position 2)
    await reorderQuestions(page, 0, 2);

    // Wait for the reordering to take effect
    await expect(async () => {
      const firstPositionText = await getQuestionOrderAndText(page, 0);
      expect(firstPositionText.text).toBe("Choice question");
    }).toPass();

    // Verify positions after first reorder
    const afterFirst: { order: string; text: string }[] = [];
    for (let i = 0; i < 3; i++) {
      afterFirst.push(await getQuestionOrderAndText(page, i));
    }

    expect(afterFirst[0].text).toBe("Choice question");
    expect(afterFirst[0].order).toBe("1");
    expect(afterFirst[1].text).toBe("Multiple select question");
    expect(afterFirst[1].order).toBe("2");
    expect(afterFirst[2].text).toBe("Essay question");
    expect(afterFirst[2].order).toBe("3");

    // Reorder: move multiple select question (index 2) to position 0
    await reorderQuestions(page, 2, 0);

    // Wait for the reordering to take effect
    await expect(async () => {
      const firstPositionText = await getQuestionOrderAndText(page, 0);
      expect(firstPositionText.text).toBe("Multiple select question");
    }).toPass();

    // Verify final positions
    const final: { order: string; text: string }[] = [];
    for (let i = 0; i < 3; i++) {
      final.push(await getQuestionOrderAndText(page, i));
    }

    expect(final[0].text).toBe("Multiple select question");
    expect(final[0].order).toBe("1");
    expect(final[1].text).toBe("Choice question");
    expect(final[1].order).toBe("2");
    expect(final[2].text).toBe("Essay question");
    expect(final[2].order).toBe("3");
  });
});
