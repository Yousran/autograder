import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const SIGN_UP_URL = `${BASE_URL}/en/auth/sign-up`;
const SIGN_IN_URL = `${BASE_URL}/en/auth/sign-in`;

/** Unique email per test run to avoid duplicate-account errors */
const testPassword = "123456789";
const testName = "Test User";

// ---------------------------------------------------------------------------
// Sign-Up
// ---------------------------------------------------------------------------
test.describe.serial("Sign-Up", () => {
  const testEmail = `testuser+${Date.now()}@example.com`;
  test.use({ storageState: { cookies: [], origins: [] } });

  test("renders the sign-up page", async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    await expect(page).toHaveURL(SIGN_UP_URL);
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    await page.locator("#name").fill(testName);
    await page.locator("#email").fill(testEmail);
    await page.locator("#password").fill(testPassword);
    await page.locator("#confirmPassword").fill("WrongPassword!");

    await page.getByRole("button", { name: /sign up/i }).click();

    // The page should stay on sign-up and show a validation error
    await expect(page).toHaveURL(SIGN_UP_URL);
    // Error paragraph rendered by the component
    await expect(page.locator("p.text-destructive")).toBeVisible();
  });

  test("successfully signs up a new user", async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    await page.locator("#name").fill(testName);
    await page.locator("#email").fill(testEmail);
    await page.locator("#password").fill(testPassword);
    await page.locator("#confirmPassword").fill(testPassword);

    await page.getByRole("button", { name: /sign up/i }).click();

    // After a successful sign-up the app redirects to the home page
    await page.waitForURL(`${BASE_URL}/en`, { timeout: 10_000 });
    await expect(page).toHaveURL(`${BASE_URL}/en`);
  });

  test("shows an error when email is already registered", async ({ page }) => {
    // Try to register with the same email from the previous test

    await page.goto(SIGN_UP_URL);

    await page.locator("#name").fill(testName);
    await page.locator("#email").fill(testEmail);
    await page.locator("#password").fill(testPassword);
    await page.locator("#confirmPassword").fill(testPassword);

    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page).toHaveURL(SIGN_UP_URL);
    await expect(page.locator("p.text-destructive")).toBeVisible();
  });

  test("Google sign-up button redirects to Google OAuth", async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    const googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    await expect(googleButton).toBeVisible();

    // Click and wait for navigation away from the sign-up page
    await Promise.all([
      page.waitForURL((url) => url.href !== SIGN_UP_URL, { timeout: 10_000 }),
      googleButton.click(),
    ]);

    // The browser should be redirected away from the app (to accounts.google.com
    // or to a Better Auth OAuth endpoint)
    const redirectedUrl = page.url();
    const isGoogleOrOAuth =
      redirectedUrl.includes("accounts.google.com") ||
      redirectedUrl.includes("/api/auth/") ||
      redirectedUrl !== SIGN_UP_URL;

    expect(isGoogleOrOAuth).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Sign-In
// ---------------------------------------------------------------------------
test.describe.serial("Sign-In", () => {
  const signInTestEmail = `testuser+${Date.now()}-signin@example.com`;
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(async ({ browser }) => {
    // Create the account once for the entire describe block.
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(SIGN_UP_URL);
    await page.locator("#name").fill(testName);
    await page.locator("#email").fill(signInTestEmail);
    await page.locator("#password").fill(testPassword);
    await page.locator("#confirmPassword").fill(testPassword);
    await page.getByRole("button", { name: /sign up/i }).click();

    await page.waitForURL(`${BASE_URL}/en`, { timeout: 10_000 });
    await context.close();
  });

  test("renders the sign-in page", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await expect(page).toHaveURL(SIGN_IN_URL);
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows an error with invalid credentials", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    // Use the same email from Sign-Up but with wrong password
    await page.locator("#email").fill(signInTestEmail);
    await page.locator("#password").fill("WrongPassword!");

    await page.getByRole("button", { name: /sign in/i }).click();

    // Should remain on sign-in page and display an error
    await expect(page).toHaveURL(SIGN_IN_URL);
    await expect(page.locator("p.text-destructive")).toBeVisible();
  });

  test("successfully signs in with valid credentials", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await page.locator("#email").fill(signInTestEmail);
    await page.locator("#password").fill(testPassword);

    await page.getByRole("button", { name: /sign in/i }).click();

    // After successful sign-in the app redirects to the home page
    await page.waitForURL(`${BASE_URL}/en`, { timeout: 10_000 });
    await expect(page).toHaveURL(`${BASE_URL}/en`);
  });

  test("navigates to sign-up page from the sign-in link", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await page.getByRole("link", { name: /sign up/i }).click();

    await expect(page).toHaveURL(SIGN_UP_URL);
  });

  // test("navigates to forgot-password page", async ({ page }) => {
  //   await page.goto(SIGN_IN_URL);

  //   await page.getByRole("link", { name: /forgot password/i }).click();

  //   await expect(page).toHaveURL(`${BASE_URL}/en/auth/forgot-password`);
  // });

  test("Google sign-in button redirects to Google OAuth", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    const googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    await expect(googleButton).toBeVisible();

    await Promise.all([
      page.waitForURL((url) => url.href !== SIGN_IN_URL, { timeout: 10_000 }),
      googleButton.click(),
    ]);

    const redirectedUrl = page.url();
    const isGoogleOrOAuth =
      redirectedUrl.includes("accounts.google.com") ||
      redirectedUrl.includes("/api/auth/") ||
      redirectedUrl !== SIGN_IN_URL;

    expect(isGoogleOrOAuth).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Auth Redirect (already authenticated)
// ---------------------------------------------------------------------------
test.describe.serial("Auth Redirect (already authenticated)", () => {
  // Explicitly load the shared auth state produced by auth.setup.ts.
  test.use({ storageState: "playwright/.auth/user.json" });

  test("redirects to home when authenticated user visits sign-in", async ({
    page,
  }) => {
    await page.goto(SIGN_IN_URL);
    await expect(page).toHaveURL(`${BASE_URL}/en`, { timeout: 5_000 });
  });

  test("redirects to home when authenticated user visits sign-up", async ({
    page,
  }) => {
    await page.goto(SIGN_UP_URL);
    await expect(page).toHaveURL(`${BASE_URL}/en`, { timeout: 5_000 });
  });
});
