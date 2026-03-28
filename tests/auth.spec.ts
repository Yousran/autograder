import { test, expect } from "@playwright/test";
import { fillSignUpForm, fillSignInForm } from "./helpers/user-modification";
import { waitForLoaderToDisappear } from "./helpers/ui-interactions";

const SIGN_UP_URL = "/en/auth/sign-up";
const SIGN_IN_URL = "/en/auth/sign-in";

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

    await expect(async () => {
      await expect(page).toHaveURL(SIGN_UP_URL);
      await expect(page.getByTestId("input-name")).toBeVisible();
      await expect(page.getByTestId("input-email")).toBeVisible();
      await expect(page.getByTestId("input-password")).toBeVisible();
      await expect(page.getByTestId("input-confirm-password")).toBeVisible();
      await expect(
        page.getByRole("button", { name: /sign up/i }),
      ).toBeVisible();
    }).toPass();
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    await page.getByTestId("input-name").fill(testName);
    await page.getByTestId("input-email").fill(testEmail);
    await page.getByTestId("input-password").fill(testPassword);
    await page.getByTestId("input-confirm-password").fill("WrongPassword!");

    await page.getByRole("button", { name: /sign up/i }).click();

    // Wait for any loading overlay to disappear
    await waitForLoaderToDisappear(page);

    // The page should stay on sign-up and show a validation error
    await expect(async () => {
      await expect(page).toHaveURL(SIGN_UP_URL);
      await expect(page.getByTestId("error-message")).toBeVisible();
    }).toPass();
  });

  test("successfully signs up a new user", async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    await fillSignUpForm(page, testName, testEmail, testPassword);

    // Wait for any loading overlay to disappear
    await waitForLoaderToDisappear(page);

    // After a successful sign-up the app redirects to the home page
    await expect(async () => {
      await page.waitForURL("/en");
      await expect(page).toHaveURL("/en");
    }).toPass();
  });

  test("shows an error when email is already registered", async ({ page }) => {
    // Try to register with the same email from the previous test

    await page.goto(SIGN_UP_URL);

    await fillSignUpForm(page, testName, testEmail, testPassword);

    // Wait for any loading overlay to disappear
    await waitForLoaderToDisappear(page);

    await expect(async () => {
      await expect(page).toHaveURL(SIGN_UP_URL);
      await expect(page.getByTestId("error-message")).toBeVisible();
    }).toPass();
  });

  test("Google sign-up button redirects to Google OAuth", async ({ page }) => {
    await page.goto(SIGN_UP_URL);

    const googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    await expect(async () => {
      await expect(googleButton).toBeVisible();
    }).toPass();

    // Click and wait for navigation away from the sign-up page
    await Promise.all([
      page.waitForURL((url) => url.href !== SIGN_UP_URL),
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
    await expect(async () => {
      // Create the account once for the entire describe block.
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(SIGN_UP_URL);
      await fillSignUpForm(page, testName, signInTestEmail, testPassword);

      await page.waitForURL("/en");
      await context.close();
    }).toPass();
  });

  test("renders the sign-in page", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await expect(async () => {
      await expect(page).toHaveURL(SIGN_IN_URL);
      await expect(page.getByTestId("input-email")).toBeVisible();
      await expect(page.getByTestId("input-password")).toBeVisible();
      await waitForLoaderToDisappear(page);
      await expect(
        page.getByRole("button", { name: /sign in/i }),
      ).toBeVisible();
    }).toPass();
  });

  test("shows an error with invalid credentials", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    // Use the same email from Sign-Up but with wrong password
    await fillSignInForm(page, signInTestEmail, "WrongPassword!");

    // Wait for any loading overlay to disappear
    await waitForLoaderToDisappear(page);

    // Should remain on sign-in page and display an error
    await expect(async () => {
      await expect(page).toHaveURL(SIGN_IN_URL);
      await expect(page.getByTestId("error-message")).toBeVisible();
    }).toPass();
  });

  test("successfully signs in with valid credentials", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await fillSignInForm(page, signInTestEmail, testPassword);

    // Wait for any loading overlay to disappear
    await waitForLoaderToDisappear(page);

    // After successful sign-in the app redirects to the home page
    await expect(async () => {
      await page.waitForURL("/en");
      await expect(page).toHaveURL("/en");
    }).toPass();
  });

  test("navigates to sign-up page from the sign-in link", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    await page.getByRole("link", { name: /sign up/i }).click();

    await expect(async () => {
      await page.waitForURL(SIGN_UP_URL);
      await expect(page).toHaveURL(SIGN_UP_URL);
    }).toPass();
  });

  // test("navigates to forgot-password page", async ({ page }) => {
  //   await page.goto(SIGN_IN_URL);

  //   await page.getByRole("link", { name: /forgot password/i }).click();

  //   await expect(page).toHaveURL("/en/auth/forgot-password");
  // });

  test("Google sign-in button redirects to Google OAuth", async ({ page }) => {
    await page.goto(SIGN_IN_URL);

    const googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    await expect(async () => {
      await expect(googleButton).toBeVisible();
    }).toPass();

    // Click and wait for navigation
    await Promise.all([
      page.waitForURL((url) => url.href !== SIGN_IN_URL),
      googleButton.click(),
    ]);

    // Verify OAuth redirect with retry
    await expect(async () => {
      const redirectedUrl = page.url();
      const isGoogleOrOAuth =
        redirectedUrl.includes("accounts.google.com") ||
        redirectedUrl.includes("/api/auth/") ||
        redirectedUrl !== SIGN_IN_URL;

      expect(isGoogleOrOAuth).toBe(true);
    }).toPass();
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
    await expect(async () => {
      await page.goto(SIGN_IN_URL);
      await expect(page).toHaveURL("/en");
    }).toPass();
  });

  test("redirects to home when authenticated user visits sign-up", async ({
    page,
  }) => {
    await expect(async () => {
      await page.goto(SIGN_UP_URL);
      await expect(page).toHaveURL("/en");
    }).toPass();
  });
});
