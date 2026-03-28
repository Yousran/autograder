import { Page } from "@playwright/test";
import { waitForLoaderToDisappear } from "./ui-interactions";

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
  await page.getByTestId("input-name").fill(name);
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page.getByTestId("input-confirm-password").fill(password);
  await page.getByRole("button", { name: /sign up/i }).click();
}

/**
 * Helper: Navigate to the profile page via the navbar user menu.
 */
export async function navigateToProfilePage(page: Page): Promise<void> {
  const userMenuButton = page.getByTestId("btn-user-menu");
  await userMenuButton.click();
  await waitForLoaderToDisappear(page);
  const profileMenuItem = page.getByTestId("link-profile");
  await profileMenuItem.waitFor({ state: "visible" });
  await profileMenuItem.click();
  await waitForLoaderToDisappear(page);
  await page.waitForURL((url) => url.href.includes("/profile/"));
}
