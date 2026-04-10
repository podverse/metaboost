import type { Locator, Page, TestInfo } from '@playwright/test';

import { expect } from '@playwright/test';

import { actionAndCapture } from './stepScreenshots';

/**
 * URL assertions: Prefer parsing page.url() and asserting url.pathname and
 * url.searchParams where route contracts are strict, instead of broad URL regexes.
 */

/** Asserts the 404 (not-found) page is visible. Use for any test that expects the custom not-found page. */
export async function expectNotFoundPageVisible(page: Page): Promise<void> {
  const customNotFound = page.getByTestId('not-found-page');
  const frameworkNotFoundHeading = page.getByRole('heading', { name: /page not found/i });
  const frameworkNotFoundText = page.getByText(/this page could not be found/i);

  if ((await customNotFound.count()) > 0) {
    await expect(customNotFound).toBeVisible();
    return;
  }

  if ((await frameworkNotFoundHeading.count()) > 0) {
    await expect(frameworkNotFoundHeading).toBeVisible();
    await expect(frameworkNotFoundText).toBeVisible();
    return;
  }

  await expect(frameworkNotFoundText).toBeVisible();
}

export async function expectInvalidRouteShowsNotFound(
  page: Page,
  testInfo: TestInfo,
  stepLabel: string,
  action: () => Promise<void>
): Promise<void> {
  await actionAndCapture(page, testInfo, stepLabel, async () => {
    await action();
    await expectNotFoundPageVisible(page);
  });
}

export async function clickDeleteAndAcceptBrowserDialog(
  page: Page,
  deleteButton: Locator
): Promise<void> {
  // Contract: destructive row-level deletes use browser confirm dialogs in web e2e flows.
  page.once('dialog', (dialog) => dialog.accept());
  await deleteButton.click();
}
