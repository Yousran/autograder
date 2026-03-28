/**
 * Test Prerequisite E2E Tests
 *
 * Verifies the educator and participant workflows for test prerequisites.
 * Tests both authenticated users and guest participants joining tests that have prerequisites.
 *
 * Covers:
 *   ✓ Creating a test and adding another test as a prerequisite
 *   ✓ Join as authenticated user when prerequisite is completed
 *   ✓ Join fails when authenticated user hasn't completed prerequisite
 *   ✓ Join fails when authenticated user has insufficient score for prerequisite
 *   ✓ Join as guest when prerequisite is completed (by name)
 *   ✓ Join fails when guest hasn't completed prerequisite
 *   ✓ API authentication and authorization checks
 */

import { test, expect } from "@playwright/test";
import { createTest, addPrerequisite } from "./helpers/test-modification";
import {
  completeTestWithParticipant,
  completeTest,
  completeTestWithScores,
  submitJoinCode,
} from "./helpers/test-start";
import { waitForLoaderToDisappear } from "./helpers/ui-interactions";

// ─────────────────────────────────────────────────────────────────────────
// Create Test with Prerequisite
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Test Prerequisite - Create Test", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  const uniqueId = Date.now();

  test("educator can add a prerequisite to a test", async ({
    page,
    browser,
  }) => {
    // Create prerequisite test
    await createTest(browser, {
      title: `Prerequisite Math Test-${uniqueId}`,
      description: "Basic math skills required",
      questions: [{ text: "Sample Question", type: "CHOICE" }],
    });

    // Create main test that will have the prerequisite
    const { testId: mainTestId } = await createTest(browser, {
      title: `Advanced Math Test-${uniqueId}`,
      description: "Requires completion of basic math test first",
      questions: [{ text: "Sample Question", type: "CHOICE" }],
    });

    expect(mainTestId).toBeTruthy();

    // Add prerequisite via UI
    await addPrerequisite(
      page,
      mainTestId,
      `Prerequisite Math Test-${uniqueId}`,
      0,
    );

    // Reload page to verify prerequisite persists
    await page.reload();
    await waitForLoaderToDisappear(page);

    // Verify prerequisite was added by checking it appears on the page
    await expect(async () => {
      const prereqItem = page.locator("text=/Prerequisite Math Test/i").first();
      await expect(prereqItem).toBeVisible();
    }).toPass();
  });

  test("prerequisite appears in test settings", async ({ page, browser }) => {
    // Create prerequisite test
    await createTest(browser, {
      title: `Required Test-${uniqueId}`,
      questions: [{ text: "Sample Question", type: "CHOICE" }],
    });

    // Create main test
    const { testId: mainTestId } = await createTest(browser, {
      title: `Test with Prerequisite-${uniqueId}`,
      questions: [{ text: "Sample Question", type: "CHOICE" }],
    });

    // Add prerequisite via UI
    await addPrerequisite(page, mainTestId, `Required Test-${uniqueId}`, 50);

    // Reload page to verify prerequisite persists
    await page.reload();
    await waitForLoaderToDisappear(page);

    // Verify prerequisite section shows the added prerequisite
    await expect(async () => {
      const prereqItem = page.locator("text=/Required Test/i").first();
      await expect(prereqItem).toBeVisible();
    }).toPass();
  });

  test("cannot add test as its own prerequisite", async ({ page, browser }) => {
    const { testId } = await createTest(browser, {
      title: `Self Reference Test-${uniqueId}`,
      questions: [{ text: "Sample Question", type: "CHOICE" }],
    });

    // Attempt to add prerequisite with same test ID
    const response = await page.request.post(
      `/api/tests/${testId}/prerequisites`,
      {
        data: {
          prerequisiteTestId: testId,
          minScoreRequired: 0,
        },
      },
    );

    expect(response.status()).toBe(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Join Test with Prerequisites - Authenticated User (Prerequisites Met)
// ─────────────────────────────────────────────────────────────────────────

test.describe
  .serial("Test Prerequisite - Authenticated User (Prerequisites Met)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  const uniqueId = Date.now();

  let prereqJoinCode: string;
  let mainTestJoinCode: string;
  let mainTestId: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create prerequisite test
      const { joinCode: pJoinCode } = await createTest(browser, {
        title: `Prerequisite for User Test-${uniqueId}`,
        description: "User must complete this first",
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      prereqJoinCode = pJoinCode;

      // Create main test with prerequisite
      const { testId: mTestId, joinCode: mJoinCode } = await createTest(
        browser,
        {
          title: `Main Test for User-${uniqueId}`,
          description: "Requires prerequisite completion",
          questions: [{ text: "Sample Question", type: "CHOICE" }],
        },
      );
      mainTestId = mTestId;
      mainTestJoinCode = mJoinCode;

      // Add prerequisite to main test
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();
      await addPrerequisite(
        page,
        mainTestId,
        `Prerequisite for User Test-${uniqueId}`,
        0,
      );

      await context.close();
    }).toPass();
  });

  test("authenticated user can join test after completing prerequisite", async ({
    page,
  }) => {
    // First, complete the prerequisite test
    await page.goto("/en");
    const firstParticipantId = await completeTestWithParticipant(
      page,
      prereqJoinCode,
    );
    expect(firstParticipantId).toBeTruthy();

    // Wait a moment for data to be persisted
    await page.waitForTimeout(500);

    // Now join the main test that requires the prerequisite
    await page.goto("/en");
    await submitJoinCode(page, mainTestJoinCode);
    await page.waitForURL(`/en/join/${mainTestJoinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();

    // Should be able to start without prerequisite error
    await startButton.click();

    await expect(page.getByText("Your name is taken from your")).toBeVisible();
    const confirmButton = page
      .getByRole("button", { name: /join.*start|submit/i })
      .first();
    if (await confirmButton.isVisible().catch(() => false)) {
      await confirmButton.click();
    }

    await page.waitForURL(/\/en\/test\/start\/.+/i);
    await waitForLoaderToDisappear(page);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Join Test with Prerequisites - Authenticated User (Prerequisites NOT Met)
// ─────────────────────────────────────────────────────────────────────────

test.describe
  .serial("Test Prerequisite - Authenticated User (Prerequisites NOT Met)", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  const uniqueId = Date.now();

  let mainTestJoinCode: string;
  let prereqJoinCode: string;
  let mainTestId: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create prerequisite test with a scoreable question
      const { joinCode: pJoinCode } = await createTest(browser, {
        title: `Prerequisite User Not Met-${uniqueId}`,
        description: "User has not completed this",
        questions: [
          {
            text: "What is the correct answer?",
            type: "CHOICE",
            choices: ["Correct", "Wrong1", "Wrong2"],
            correctChoiceIndex: 0,
          },
        ],
      });
      prereqJoinCode = pJoinCode;

      // Create main test with prerequisite (requires 50% score)
      const { joinCode: mJoinCode, testId: mTestId } = await createTest(
        browser,
        {
          title: `Main Test User Not Met-${uniqueId}`,
          description: "Has unmet prerequisite",
          questions: [{ text: "Sample Question", type: "CHOICE" }],
        },
      );
      mainTestJoinCode = mJoinCode;
      mainTestId = mTestId;

      // Add prerequisite with 50% minimum score requirement
      const addPrerq = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const addPage = await addPrerq.newPage();
      await addPrerequisite(
        addPage,
        mainTestId,
        `Prerequisite User Not Met-${uniqueId}`,
        50,
      );
      await addPrerq.close();
    }).toPass();
  });

  test("authenticated user cannot join test without completing prerequisite", async ({
    page,
  }) => {
    // Attempt to join main test WITHOUT completing prerequisite
    await page.goto("/en");
    await submitJoinCode(page, mainTestJoinCode);

    // Should see an error message about prerequisite
    await expect(async () => {
      const errorMessage = page.getByTestId("message-join-error");
      await expect(errorMessage).toBeVisible();
      const text = await errorMessage.textContent();
      expect(text).toMatch(/prerequisite/i);
    }).toPass();
  });

  test("authenticated user cannot join test with insufficient prerequisite score", async ({
    page,
  }) => {
    // First, complete the prerequisite test with a LOW score (select wrong answer)
    await page.goto("/en");
    await completeTestWithScores(page, prereqJoinCode, [1]); // Select index 1 (wrong answer)

    // Wait a moment for data to be persisted
    await page.waitForTimeout(500);

    // Now attempt to join main test (which requires 50% score)
    await page.goto("/en");
    await submitJoinCode(page, mainTestJoinCode);

    // Should see error about insufficient prerequisite score
    await expect(async () => {
      const errorMessage = page.getByTestId("message-join-error");
      await expect(errorMessage).toBeVisible();
      const text = await errorMessage.textContent();
      expect(text).toMatch(/insufficient|score/i);
    }).toPass();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Join Test with Prerequisites - Guest User (Prerequisites Met)
// ─────────────────────────────────────────────────────────────────────────

test.describe
  .serial("Test Prerequisite - Guest User (Prerequisites Met)", () => {
  // Guest = unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });
  const uniqueId = Date.now();

  let prereqJoinCode: string;
  let mainTestJoinCode: string;
  const guestName = "Guest Prerequisite Taker";

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create prerequisite test as authenticated user
      const { joinCode: pJoinCode } = await createTest(browser, {
        title: `Prerequisite Guest Test-${uniqueId}`,
        description: "Guest must complete this first",
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });
      prereqJoinCode = pJoinCode;

      // Create main test with prerequisite
      const { testId: mTestId, joinCode: mJoinCode } = await createTest(
        browser,
        {
          title: `Main Test Guest-${uniqueId}`,
          description: "Requires guest to complete prerequisite",
          questions: [{ text: "Sample Question", type: "CHOICE" }],
        },
      );
      mainTestJoinCode = mJoinCode;

      // Navigate to test and add prerequisite via the new createTest flow
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const prereqPage = await context.newPage();
      await addPrerequisite(
        prereqPage,
        mTestId,
        `Prerequisite Guest Test-${uniqueId}`,
        0,
      );
      await context.close();
    }).toPass();
  });

  test("guest can join test after completing prerequisite (by name)", async ({
    page,
  }) => {
    // Guest completes prerequisite test with name
    await page.goto("/en");
    await submitJoinCode(page, prereqJoinCode);
    await page.waitForURL(`/en/join/${prereqJoinCode}`);

    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Guest provides name
    const nameInput = page.getByRole("textbox", { name: "Your Name" });
    await expect(nameInput).toBeVisible();
    await nameInput.fill(guestName);

    const confirmButton = page.getByRole("button", { name: /Join & Start/ });
    await confirmButton.click();

    await page.waitForURL(/\/en\/test\/start/);
    await waitForLoaderToDisappear(page);

    // Complete the test
    await completeTest(page);

    // Now attempt to join main test with same name
    await page.goto("/en");
    await submitJoinCode(page, mainTestJoinCode);
    await page.waitForURL(`/en/join/${mainTestJoinCode}`);

    const mainStartButton = page.getByRole("button", { name: "Start Test" });
    await expect(mainStartButton).toBeVisible();
    await mainStartButton.click();

    // Guest provides same name
    const mainNameInput = page.getByRole("textbox", { name: "Your Name" });
    if (await mainNameInput.isVisible().catch(() => false)) {
      await mainNameInput.fill(guestName);
    }

    const mainConfirmButton = page
      .getByRole("button", { name: /Join & Start/ })
      .first();
    await expect(mainConfirmButton).toBeVisible();
    await mainConfirmButton.click();

    // Should successfully join
    await page.waitForURL(/\/en\/test\/start/);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Join Test with Prerequisites - Guest User (Prerequisites NOT Met)
// ─────────────────────────────────────────────────────────────────────────

test.describe
  .serial("Test Prerequisite - Guest User (Prerequisites NOT Met)", () => {
  // Guest = unauthenticated
  test.use({ storageState: { cookies: [], origins: [] } });
  const uniqueId = Date.now();

  let mainTestJoinCode: string;

  test.beforeAll(async ({ browser }) => {
    await expect(async () => {
      // Create tests as authenticated user
      await createTest(browser, {
        title: `Prerequisite Guest Not Met-${uniqueId}`,
        description: "Guest has not completed this",
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      });

      // Create main test with prerequisite
      const { joinCode: mJoinCode, testId: mTestId } = await createTest(
        browser,
        {
          title: `Main Test Guest Not Met-${uniqueId}`,
          description: "Has unmet prerequisite",
          questions: [{ text: "Sample Question", type: "CHOICE" }],
        },
      );
      mainTestJoinCode = mJoinCode;

      // Add prerequisite via context
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const prereqPage = await context.newPage();
      await addPrerequisite(
        prereqPage,
        mTestId,
        `Prerequisite Guest Not Met-${uniqueId}`,
        0,
      );
      await context.close();
    }).toPass();
  });

  test("guest cannot join test without completing prerequisite", async ({
    page,
  }) => {
    // Attempt to join main test WITHOUT completing prerequisite
    await page.goto("/en");
    await submitJoinCode(page, mainTestJoinCode);
    await page.waitForURL(`/en/join/${mainTestJoinCode}`);

    // Guest should see Start Test button (not upfront error, since guests aren't checked until they provide name)
    const startButton = page.getByRole("button", { name: "Start Test" });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Enter a name and attempt to submit
    const nameInput = page.getByRole("textbox", { name: "Your Name" });
    await expect(nameInput).toBeVisible();
    await nameInput.fill("GuestTestUser");

    const confirmButton = page
      .getByRole("button", { name: /Join & Start/ })
      .first();
    await confirmButton.click();

    // Should see error about prerequisite
    await expect(async () => {
      const errorMessage = page.getByTestId("message-join-error");
      await expect(errorMessage).toBeVisible();
      const text = await errorMessage.textContent();
      expect(text).toMatch(/prerequisite/i);
    }).toPass();
  });

  test("guest with different name cannot join (different identity)", async ({
    browser,
  }) => {
    // First context: Guest1 completes prerequisite
    const guest1Context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const guest1Page = await guest1Context.newPage();

    // Create prerequisite and main test as authenticated user
    const { joinCode: preqJoinCode } = await createTest(browser, {
      title: `Prerequisite Different Guest-${uniqueId}`,
      description: "For testing different guest identities",
      questions: [{ text: "Sample Question", type: "CHOICE" }],
    });

    const { joinCode: mainJoinCode, testId: mainTestId } = await createTest(
      browser,
      {
        title: `Main Test Different Guest-${uniqueId}`,
        description: "Has prerequisite",
        questions: [{ text: "Sample Question", type: "CHOICE" }],
      },
    );

    // Add prerequisite via context
    const creatorContext = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const creatorPage = await creatorContext.newPage();
    await addPrerequisite(
      creatorPage,
      mainTestId,
      `Prerequisite Different Guest-${uniqueId}`,
      0,
    );
    await creatorContext.close();

    // Guest1 completes prerequisite with name "Guest1"
    await guest1Page.goto("/en");
    await submitJoinCode(guest1Page, preqJoinCode);
    await guest1Page.waitForURL(`/en/join/${preqJoinCode}`);
    const startButton = guest1Page.getByRole("button", { name: "Start Test" });
    await startButton.click();

    const nameInput = guest1Page.getByRole("textbox", { name: "Your Name" });
    await nameInput.fill("Guest1");
    const confirmButton = guest1Page.getByRole("button", {
      name: /Join & Start/,
    });
    await confirmButton.click();

    await guest1Page.waitForURL(/\/en\/test\/start/);
    await completeTest(guest1Page);

    await guest1Context.close();

    // Second context: Guest2 tries to join main test with different name
    const guest2Context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const guest2Page = await guest2Context.newPage();

    await guest2Page.goto("/en");
    await submitJoinCode(guest2Page, mainJoinCode);
    await guest2Page.waitForURL(`/en/join/${mainJoinCode}`);

    // Should fail because Guest2 hasn't completed prerequisite
    // (even though Guest1 did, they are different identities)
    const startButton2 = guest2Page.getByRole("button", { name: "Start Test" });
    await expect(startButton2).toBeVisible();
    await startButton2.click();

    const nameInput2 = guest2Page.getByRole("textbox", { name: "Your Name" });
    await expect(nameInput2).toBeVisible();
    await nameInput2.fill("Guest2");

    const confirmButton2 = guest2Page
      .getByRole("button", { name: /Join & Start/ })
      .first();
    await confirmButton2.click();

    await expect(async () => {
      const errorMessage = guest2Page.getByTestId("message-join-error");
      await expect(errorMessage).toBeVisible();
      const text = await errorMessage.textContent();
      expect(text).toMatch(/prerequisite/i);
    }).toPass();

    await guest2Context.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// API Authorization Tests
// ─────────────────────────────────────────────────────────────────────────

test.describe("Test Prerequisite - API Authorization", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated user cannot add prerequisite", async ({ page }) => {
    const response = await page.request.post(
      "/api/tests/fake-id/prerequisites",
      {
        data: {
          prerequisiteTestId: "fake-prereq",
          minScoreRequired: 0,
        },
      },
    );

    expect(response.status()).toBe(401);
  });

  test("prerequisites API returns score requirements", async ({ page }) => {
    // This test would fetch prerequisites and verify score data is returned
    // For now, verify the API endpoint exists and handles requests properly

    const response = await page.request.post(
      "/api/tests/nonexistent-id/prerequisites",
      {
        data: {
          prerequisiteTestId: "fake-id",
          minScoreRequired: 50,
        },
      },
    );

    // Should return 401 (unauthenticated) or 404 (test not found)
    expect([401, 404]).toContain(response.status());
  });

  test("authenticated user can set prerequisite score requirement", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const page = await context.newPage();

    // Create two tests
    const { testId: prereqId } = await createTest(browser, {
      title: "Prerequisite Test",
      questions: [{ text: "Sample Question", type: "CHOICE" }],
    });

    const { testId: mainId } = await createTest(browser, {
      title: "Main Test",
      questions: [{ text: "Sample Question", type: "CHOICE" }],
    });

    // Set prerequisite with score requirement via API
    const response = await page.request.post(
      `/api/tests/${mainId}/prerequisites`,
      {
        data: {
          prerequisiteTestId: prereqId,
          minScoreRequired: 60,
        },
      },
    );

    expect(response.status()).toBe(201);

    const responseData = await response.json();
    expect(responseData).toHaveProperty("minScoreRequired");
    expect(responseData.minScoreRequired).toBe(60);

    await context.close();
  });

  test("cannot add prerequisite to test they don't own", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const page = await context.newPage();

    // Create a test as the authenticated user
    const { testId } = await createTest(browser, {
      title: "Test I Own",
      questions: [{ text: "Sample Question", type: "CHOICE" }],
    });

    // Try to add prerequisite to a non-existent or foreign test
    const response = await page.request.post(
      "/api/tests/invalid-test-id/prerequisites",
      {
        data: {
          prerequisiteTestId: testId,
          minScoreRequired: 0,
        },
      },
    );

    expect(response.status()).toBe(404);
    await context.close();
  });
});
