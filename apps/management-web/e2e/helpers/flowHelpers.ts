import type { Page, TestInfo } from '@playwright/test';

import { expect } from '@playwright/test';

import { actionAndCapture } from './stepScreenshots';

/**
 * URL assertions: Prefer parsing page.url() and asserting url.pathname and
 * url.searchParams where route contracts are strict, instead of broad URL regexes.
 */

/** Asserts the 404 (not-found) page is visible. Use for any test that expects the custom not-found page. */
export async function expectNotFoundPageVisible(page: Page): Promise<void> {
  await expect(page.getByTestId('not-found-page')).toBeVisible();
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

export async function clickConfirmDeleteInModal(page: Page): Promise<void> {
  // Contract: after triggering row delete, exactly one modal-level "Delete" action should be visible.
  const dialogDelete = page.getByRole('dialog').getByRole('button', { name: /^delete$/i });

  if ((await dialogDelete.count()) > 0) {
    await expect(dialogDelete).toHaveCount(1);
    await expect(dialogDelete).toBeVisible();
    await dialogDelete.click();
    return;
  }

  const alertDialogDelete = page
    .getByRole('alertdialog')
    .getByRole('button', { name: /^delete$/i });
  if ((await alertDialogDelete.count()) > 0) {
    await expect(alertDialogDelete).toHaveCount(1);
    await expect(alertDialogDelete).toBeVisible();
    await alertDialogDelete.click();
    return;
  }

  const confirmMessage = page.getByText(/are you sure you want to delete/i).first();
  if ((await confirmMessage.count()) > 0) {
    const confirmPanel = confirmMessage.locator(
      'xpath=ancestor::*[.//button[normalize-space()="Cancel"] and .//button[normalize-space()="Delete"]][1]'
    );
    const confirmDelete = confirmPanel.getByRole('button', { name: /^delete$/i });
    await expect(confirmDelete).toHaveCount(1);
    await expect(confirmDelete).toBeVisible();
    await confirmDelete.click();
    return;
  }

  // Final fallback: click the last visible Delete action when no semantic modal anchors exist.
  const deleteButtons = page.getByRole('button', { name: /^delete$/i });
  const total = await deleteButtons.count();
  let lastVisibleIndex = -1;
  for (let i = 0; i < total; i += 1) {
    if (await deleteButtons.nth(i).isVisible()) {
      lastVisibleIndex = i;
    }
  }
  await expect(lastVisibleIndex).toBeGreaterThanOrEqual(0);
  await deleteButtons.nth(lastVisibleIndex).click();
}
