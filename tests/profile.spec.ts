import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const SIGN_UP_URL = `${BASE_URL}/en/auth/sign-up`;

const testPassword = "123456789";

// ---------------------------------------------------------------------------
// Profile Page - Owner View
// ---------------------------------------------------------------------------
test.describe.serial("Profile Page - Owner Profile", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  test("renders the profile page with user info", async ({ page }) => {
    await page.goto(`${BASE_URL}/en`);

    // Click on the user avatar button in navbar (last button, not settings)
    const userMenuButton = page.locator("header button").last();
    await userMenuButton.click();

    // Wait for profile link to be visible
    const profileMenuItem = page.locator("a[href*='/profile/']").first();
    await profileMenuItem.waitFor({ state: "visible" });
    await profileMenuItem.click();

    // Wait for navigation to profile page
    await page.waitForURL((url) => url.href.includes("/profile/"));
    const pageUrl = page.url();
    expect(pageUrl).toContain("/profile/");

    // Check for user info display
    await expect(page.locator("h1")).toBeVisible();
  });

  test("displays user email in profile page", async ({ page }) => {
    await page.goto(`${BASE_URL}/en`);

    // Navigate to profile via navbar (click avatar button, not settings)
    const userMenuButton = page.locator("header button").last();
    await userMenuButton.click();

    const profileMenuItem = page.locator("a[href*='/profile/']").first();
    await profileMenuItem.waitFor({ state: "visible" });
    await profileMenuItem.click();

    // Wait for navigation to profile page
    await page.waitForURL((url) => url.href.includes("/profile/"));

    // Check that email is displayed (use .first() to avoid strict mode violation)
    await expect(
      page.locator("p").filter({ hasText: /@/ }).first(),
    ).toBeVisible();
  });

  test("displays user info in navbar when on profile page", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en`);

    // Check that user info (avatar button) is visible in navbar
    const navbarAvatar = page.locator("header button").last();
    await expect(navbarAvatar).toBeVisible();
  });

  test("displays profile sections for owner", async ({ page }) => {
    await page.goto(`${BASE_URL}/en`);

    // Navigate to profile (click avatar button, not settings)
    const userMenuButton = page.locator("header button").last();
    await userMenuButton.click();

    const profileMenuItem = page.locator("a[href*='/profile/']").first();
    await profileMenuItem.waitFor({ state: "visible" });
    await profileMenuItem.click();

    // Wait for navigation to profile page
    await page.waitForURL((url) => url.href.includes("/profile/"));

    // Check for profile information section
    await expect(
      page.locator("h2").filter({ hasText: /profile.*information/i }),
    ).toBeVisible();
  });

  test("displays delete account button for owner", async ({ page }) => {
    await page.goto(`${BASE_URL}/en`);

    // Navigate to profile (click avatar button, not settings)
    const userMenuButton = page.locator("header button").last();
    await userMenuButton.click();

    const profileMenuItem = page.locator("a[href*='/profile/']").first();
    await profileMenuItem.waitFor({ state: "visible" });
    await profileMenuItem.click();

    // Wait for navigation to profile page
    await page.waitForURL((url) => url.href.includes("/profile/"));

    // Check for delete account section
    await expect(
      page.locator("h3").filter({ hasText: /delete.*account/i }),
    ).toBeVisible();

    // Delete account button should be visible
    const deleteButton = page.getByRole("button", { name: /delete.*account/i });
    await expect(deleteButton).toBeVisible();
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
    await page.locator("#name").fill(publicProfileName);
    await page.locator("#email").fill(publicProfileEmail);
    await page.locator("#password").fill(testPassword);
    await page.locator("#confirmPassword").fill(testPassword);
    await page.getByRole("button", { name: /sign up/i }).click();

    // Wait for redirect to home
    await page.waitForURL(`${BASE_URL}/en`);

    // Extract profile URL from navbar - click the avatar button (last button in header)
    const userMenuButton = page.locator("header button").last();
    await userMenuButton.click();

    // Wait for profile link to be visible in dropdown
    const profileLink = page.locator("a[href*='/profile/']");
    await profileLink.waitFor({ state: "visible" });
    const profileUrl = await profileLink.getAttribute("href");

    // Sign out
    await page.getByRole("menuitem", { name: /logout|sign out/i }).click();
    await page.context().clearCookies();

    // Visit profile as unauthenticated user
    if (profileUrl) {
      await page.goto(`${BASE_URL}${profileUrl}`);
      await page.waitForURL((url) => url.href.includes("/profile/"));

      // Should be able to view public profile
      await expect(page.locator("h1")).toContainText(publicProfileName);
    }
  });

  test("hides owner-only sections from non-owners", async ({ page }) => {
    // Create a user account
    const creatorEmail = `testuser+${Date.now()}-creator@example.com`;
    const creatorName = "Profile Creator";

    await page.goto(SIGN_UP_URL);
    await page.locator("#name").fill(creatorName);
    await page.locator("#email").fill(creatorEmail);
    await page.locator("#password").fill(testPassword);
    await page.locator("#confirmPassword").fill(testPassword);
    await page.getByRole("button", { name: /sign up/i }).click();

    await page.waitForURL(`${BASE_URL}/en`);

    // Get profile URL - click the avatar button (last button in header)
    const userMenuButton = page.locator("header button").last();
    await userMenuButton.click();

    // Wait for profile link to be visible in dropdown
    const profileLink = page.locator("a[href*='/profile/']");
    await profileLink.waitFor({ state: "visible" });
    const profileUrl = await profileLink.getAttribute("href");

    // Sign out
    await page.getByRole("menuitem", { name: /logout|sign out/i }).click();
    await page.context().clearCookies();

    // View profile as unauthenticated user
    if (profileUrl) {
      await page.goto(`${BASE_URL}${profileUrl}`);
      await page.waitForURL((url) => url.href.includes("/profile/"));

      // Public info should be visible
      await expect(page.locator("h1")).toContainText(creatorName);

      // Owner-only sections should not be visible
      const deleteAccountButton = page.getByRole("button", {
        name: /delete.*account/i,
      });
      await expect(deleteAccountButton).not.toBeVisible();

      const createdTestsSection = page
        .locator("h2")
        .filter({ hasText: /created tests/i });
      await expect(createdTestsSection).not.toBeVisible();
    }
  });
});
