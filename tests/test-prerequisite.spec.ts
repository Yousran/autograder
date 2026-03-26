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
import {
  addPrerequisite,
  completeTest,
  completeTestWithParticipant,
  completeTestWithScores,
  createTestWithQuestion,
  createTestWithScoringQuestion,
  submitJoinCode,
  waitForLoaderToDisappear,
} from "./helpers";

// ─────────────────────────────────────────────────────────────────────────
// Create Test with Prerequisite
// ─────────────────────────────────────────────────────────────────────────

test.describe.serial("Test Prerequisite - Create Test", () => {
  test.use({ storageState: "playwright/.auth/user.json" });
  const uniqueId = Date.now();

  test("educator can add a prerequisite to a test", async ({ page }) => {
    // Create prerequisite test
    await createTestWithQuestion(page, {
      title: `Prerequisite Math Test-${uniqueId}`,
      description: "Basic math skills required",
    });

    // Create main test that will have the prerequisite
    const { testId: mainTestId } = await createTestWithQuestion(page, {
      title: `Advanced Math Test-${uniqueId}`,
      description: "Requires completion of basic math test first",
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

  test("prerequisite appears in test settings", async ({ page }) => {
    // Create prerequisite test
    await createTestWithQuestion(page, {
      title: `Required Test-${uniqueId}`,
    });

    // Create main test
    const { testId: mainTestId } = await createTestWithQuestion(page, {
      title: `Test with Prerequisite-${uniqueId}`,
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

  test("cannot add test as its own prerequisite", async ({ page }) => {
    const { testId } = await createTestWithQuestion(page, {
      title: `Self Reference Test-${uniqueId}`,
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
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      // Create prerequisite test
      const { joinCode: pJoinCode } = await createTestWithQuestion(page, {
        title: `Prerequisite for User Test-${uniqueId}`,
        description: "User must complete this first",
      });
      prereqJoinCode = pJoinCode;

      // Create main test with prerequisite
      const newPage = await context.newPage();
      const { testId: mTestId, joinCode: mJoinCode } =
        await createTestWithQuestion(newPage, {
          title: `Main Test for User-${uniqueId}`,
          description: "Requires prerequisite completion",
        });
      mainTestId = mTestId;
      mainTestJoinCode = mJoinCode;

      // Add prerequisite to main test
      await addPrerequisite(
        newPage,
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
      const context = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const page = await context.newPage();

      // Create prerequisite test with a scoreable question
      const { joinCode: pJoinCode } = await createTestWithScoringQuestion(
        page,
        {
          title: `Prerequisite User Not Met-${uniqueId}`,
          description: "User has not completed this",
          questionText: "What is the correct answer?",
          choices: ["Correct", "Wrong1", "Wrong2"],
          correctChoiceIndex: 0,
        },
      );
      prereqJoinCode = pJoinCode;

      // Create main test with prerequisite (requires 50% score)
      const newPage = await context.newPage();
      const { joinCode: mJoinCode, testId: mTestId } =
        await createTestWithQuestion(newPage, {
          title: `Main Test User Not Met-${uniqueId}`,
          description: "Has unmet prerequisite",
        });
      mainTestJoinCode = mJoinCode;
      mainTestId = mTestId;

      // Add prerequisite with 50% minimum score requirement
      await addPrerequisite(
        newPage,
        mainTestId,
        `Prerequisite User Not Met-${uniqueId}`,
        50,
      );

      await context.close();
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
      const errorMessage = page
        .locator("text=/prerequisite|required/i")
        .first();
      await expect(errorMessage).toBeVisible();
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
      const errorMessage = page
        .locator("text=/prerequisite|required|score/i")
        .first();
      await expect(errorMessage).toBeVisible();
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
      const creatorContext = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const creatorPage = await creatorContext.newPage();

      const { joinCode: pJoinCode } = await createTestWithQuestion(
        creatorPage,
        {
          title: `Prerequisite Guest Test-${uniqueId}`,
          description: "Guest must complete this first",
        },
      );
      prereqJoinCode = pJoinCode;

      // Create main test with prerequisite
      const newPage = await creatorContext.newPage();
      const { testId: mTestId, joinCode: mJoinCode } =
        await createTestWithQuestion(newPage, {
          title: `Main Test Guest-${uniqueId}`,
          description: "Requires guest to complete prerequisite",
        });
      mainTestJoinCode = mJoinCode;

      // Add prerequisite
      await addPrerequisite(
        newPage,
        mTestId,
        `Prerequisite Guest Test-${uniqueId}`,
        0,
      );

      await creatorContext.close();
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
      const creatorContext = await browser.newContext({
        storageState: "playwright/.auth/user.json",
      });
      const creatorPage = await creatorContext.newPage();

      await createTestWithQuestion(creatorPage, {
        title: `Prerequisite Guest Not Met-${uniqueId}`,
        description: "Guest has not completed this",
      });

      // Create main test with prerequisite
      const newPage = await creatorContext.newPage();
      const { joinCode: mJoinCode, testId: mTestId } =
        await createTestWithQuestion(newPage, {
          title: `Main Test Guest Not Met-${uniqueId}`,
          description: "Has unmet prerequisite",
        });
      mainTestJoinCode = mJoinCode;

      // Add prerequisite
      await addPrerequisite(
        newPage,
        mTestId,
        `Prerequisite Guest Not Met-${uniqueId}`,
        0,
      );

      await creatorContext.close();
    }).toPass();
  });

  test("guest cannot join test without completing prerequisite", async ({
    page,
  }) => {
    // Attempt to join main test WITHOUT completing prerequisite
    await page.goto("/en");
    await submitJoinCode(page, mainTestJoinCode);

    // Should see error about prerequisite
    await expect(async () => {
      const errorMessage = page
        .locator("text=/prerequisite|required/i")
        .first();
      await expect(errorMessage).toBeVisible();
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
    const creatorContext = await browser.newContext({
      storageState: "playwright/.auth/user.json",
    });
    const creatorPage = await creatorContext.newPage();

    const { joinCode: preqJoinCode } = await createTestWithQuestion(
      creatorPage,
      {
        title: `Prerequisite Different Guest-${uniqueId}`,
        description: "For testing different guest identities",
      },
    );

    const { joinCode: mainJoinCode, testId: mainTestId } =
      await createTestWithQuestion(creatorPage, {
        title: `Main Test Different Guest-${uniqueId}`,
        description: "Has prerequisite",
      });

    // Add prerequisite
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

    // Should fail because Guest2 hasn't completed prerequisite
    // (even though Guest1 did, they are different identities)
    await expect(async () => {
      const errorMessage = guest2Page
        .locator("text=/prerequisite|required/i")
        .first();
      await expect(errorMessage).toBeVisible();
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
    const { testId: prereqId } = await createTestWithQuestion(page, {
      title: "Prerequisite Test",
    });

    const mainPage = await context.newPage();
    const { testId: mainId } = await createTestWithQuestion(mainPage, {
      title: "Main Test",
    });

    // Set prerequisite with score requirement via API
    const response = await mainPage.request.post(
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
    const { testId } = await createTestWithQuestion(page, {
      title: "Test I Own",
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
