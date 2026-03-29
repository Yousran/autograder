import { Page } from "@playwright/test";

/**
 * Helper: Wait for loading spinner/overlay to disappear
 * Checks if a spinner or loading overlay exists and waits for it to be hidden
 */
export async function waitForLoaderToDisappear(page: Page): Promise<void> {
  const spinner = page.locator(
    '[role="progressbar"], .spinner, .loading, [class*="loader"]',
  );
  if (
    await spinner
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await spinner.first().waitFor({ state: "hidden" });
  }
}

/**
 * Helper: Wait for skeleton loaders to disappear
 * Checks if skeleton elements exist and waits for them to be hidden
 */
export async function waitForSkeletonToDisappear(page: Page): Promise<void> {
  const skeleton = page.locator('[data-slot="skeleton"]');
  if (
    await skeleton
      .first()
      .isVisible()
      .catch(() => false)
  ) {
    await skeleton.first().waitFor({ state: "hidden" });
  }
}
