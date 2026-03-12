import { test, expect } from "@playwright/test";
import {
  fillSignUpForm,
  navigateToProfilePage,
  waitForLoaderToDisappear,
} from "./helpers";

const SIGN_UP_URL = "/en/auth/sign-up";

const testPassword = "123456789";

// ---------------------------------------------------------------------------
// Profile Page - Owner View
// ---------------------------------------------------------------------------
test.describe.serial("Profile Page - Owner Profile", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("renders the profile page with user info", async ({ page }) => {
    await page.goto("/en");

    await navigateToProfilePage(page);
    const pageUrl = page.url();
    await expect(async () => {
      expect(pageUrl).toContain("/profile/");
    }).toPass();

    // Check for user info display
    await expect(async () => {
      await expect(page.locator("h1")).toBeVisible();
    }).toPass();
  });

  test("displays user email in profile page", async ({ page }) => {
    await page.goto("/en");

    await navigateToProfilePage(page);

    // Check that email is displayed (use .first() to avoid strict mode violation)
    await expect(async () => {
      await expect(
        page.locator("p").filter({ hasText: /@/ }).first(),
      ).toBeVisible();
    }).toPass();
  });

  test("displays user info in navbar when on profile page", async ({
    page,
  }) => {
    await page.goto("/en");

    // Check that user info (avatar button) is visible in navbar
    const navbarAvatar = page.locator("header button").last();
    await expect(async () => {
      await expect(navbarAvatar).toBeVisible();
    }).toPass();
  });

  test("displays profile sections for owner", async ({ page }) => {
    await page.goto("/en");

    await navigateToProfilePage(page);

    // Check for profile information section
    await expect(async () => {
      await expect(
        page.locator("h2").filter({ hasText: /profile.*information/i }),
      ).toBeVisible();
    }).toPass();
  });

  test("displays delete account button for owner", async ({ page }) => {
    await page.goto("/en");

    await navigateToProfilePage(page);

    // Check for delete account section
    await expect(async () => {
      await expect(
        page.locator("h3").filter({ hasText: /delete.*account/i }),
      ).toBeVisible();
    }).toPass();

    // Delete account button should be visible
    const deleteButton = page.getByRole("button", { name: /delete.*account/i });
    await expect(async () => {
      await expect(deleteButton).toBeVisible();
    }).toPass();
  });
});

// ---------------------------------------------------------------------------
// Profile Page - Unauthenticated Access
// ---------------------------------------------------------------------------
test.describe.serial("Profile Page - Unauthenticated Access", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("allows viewing public profile info without authentication", async ({
    page,
  }) => {
    // Create a user for the public profile
    const publicProfileEmail = `testuser+${Date.now()}-public@example.com`;
    const publicProfileName = "Public Test User";

    await page.goto(SIGN_UP_URL);
    await fillSignUpForm(
      page,
      publicProfileName,
      publicProfileEmail,
      testPassword,
    );

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Wait for redirect to home
    await page.waitForURL("/en");

    // Extract profile URL from navbar - click the avatar button (last button in header)
    const userMenuButton = page.locator("header button").last();
    await userMenuButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Wait for profile link to be visible in dropdown
    const profileLink = page.locator("a[href*='/profile/']");
    await profileLink.waitFor({ state: "visible" });
    const profileUrl = await profileLink.getAttribute("href");

    // Sign out
    await page.getByRole("menuitem", { name: /logout|sign out/i }).click();
    await page.context().clearCookies();

    // Visit profile as unauthenticated user
    if (profileUrl) {
      await page.goto(profileUrl);
      await page.waitForURL((url) => url.href.includes("/profile/"));

      // Should be able to view public profile
      await expect(async () => {
        await expect(page.locator("h1")).toContainText(publicProfileName);
      }).toPass();
    }
  });

  test("hides owner-only sections from non-owners", async ({ page }) => {
    // Create a user account
    const creatorEmail = `testuser+${Date.now()}-creator@example.com`;
    const creatorName = "Profile Creator";

    await page.goto(SIGN_UP_URL);
    await fillSignUpForm(page, creatorName, creatorEmail, testPassword);

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    await page.waitForURL("/en");

    // Get profile URL - click the avatar button (last button in header)
    const userMenuButton = page.locator("header button").last();
    await userMenuButton.click();

    // Wait for loader to disappear
    await waitForLoaderToDisappear(page);

    // Wait for profile link to be visible in dropdown
    const profileLink = page.locator("a[href*='/profile/']");
    await profileLink.waitFor({ state: "visible" });
    const profileUrl = await profileLink.getAttribute("href");

    // Sign out
    await page.getByRole("menuitem", { name: /logout|sign out/i }).click();
    await page.context().clearCookies();

    // View profile as unauthenticated user
    if (profileUrl) {
      await page.goto(profileUrl);
      await page.waitForURL((url) => url.href.includes("/profile/"));

      // Public info should be visible
      await expect(async () => {
        await expect(page.locator("h1")).toContainText(creatorName);
      }).toPass();

      // Owner-only sections should not be visible
      const deleteAccountButton = page.getByRole("button", {
        name: /delete.*account/i,
      });
      await expect(async () => {
        await expect(deleteAccountButton).not.toBeVisible();
      }).toPass();

      const createdTestsSection = page
        .locator("h2")
        .filter({ hasText: /created tests/i });
      await expect(async () => {
        await expect(createdTestsSection).not.toBeVisible();
      }).toPass();
    }
  });
});
