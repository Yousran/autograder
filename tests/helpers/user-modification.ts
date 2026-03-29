import { Page, Locator } from "@playwright/test";
import { waitForLoaderToDisappear } from "./ui-interactions";

// ─────────────────────────────────────────────────────────────────────────
// Getter Functions: Locate Components
// ─────────────────────────────────────────────────────────────────────────

/**
 * Helper: Get the name input element
 */
export function getNameInput(page: Page): Locator {
  return page.getByTestId("input-name");
}

/**
 * Helper: Get the email input element
 */
export function getEmailInput(page: Page): Locator {
  return page.getByTestId("input-email");
}

/**
 * Helper: Get the password input element
 */
export function getPasswordInput(page: Page): Locator {
  return page.getByTestId("input-password");
}

/**
 * Helper: Get the confirm password input element
 */
export function getConfirmPasswordInput(page: Page): Locator {
  return page.getByTestId("input-confirm-password");
}

/**
 * Helper: Get the sign-up button
 */
export function getSignUpButton(page: Page): Locator {
  return page.getByRole("button", { name: /sign up/i });
}

/**
 * Helper: Get the sign-in button
 */
export function getSignInButton(page: Page): Locator {
  return page.getByRole("button", { name: /sign in/i });
}

/**
 * Helper: Get the user menu button
 */
export function getUserMenuButton(page: Page): Locator {
  return page.getByTestId("btn-user-menu");
}

/**
 * Helper: Get the profile menu item
 */
export function getProfileMenuItem(page: Page): Locator {
  return page.getByTestId("link-profile");
}

// ─────────────────────────────────────────────────────────────────────────
// Set Functions: Form Submission
// ─────────────────────────────────────────────────────────────────────────

/**
 * Helper: Set and submit the sign-up form.
 * The caller should navigate to the sign-up URL beforehand.
 */
export async function setSignUpForm(
  page: Page,
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await getNameInput(page).fill(name);
  await getEmailInput(page).fill(email);
  await getPasswordInput(page).fill(password);
  await getConfirmPasswordInput(page).fill(password);
  await getSignUpButton(page).click();
}

/**
 * Helper: Set and submit the sign-in form.
 * The caller should navigate to the sign-in URL beforehand.
 */
export async function setSignInForm(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await getEmailInput(page).fill(email);
  await getPasswordInput(page).fill(password);
  await getSignInButton(page).click();
}

/**
 * Helper: Navigate to the profile page via the navbar user menu.
 */
export async function navigateToProfilePage(page: Page): Promise<void> {
  await getUserMenuButton(page).click();
  await waitForLoaderToDisappear(page);
  const profileMenuItem = getProfileMenuItem(page);
  await profileMenuItem.waitFor({ state: "visible" });
  await profileMenuItem.click();
  await waitForLoaderToDisappear(page);
  await page.waitForURL((url) => url.href.includes("/profile/"));
}
