import { expect, test } from '@playwright/test';

import {
  loginAsWebE2ENonAdmin,
  loginAsWebE2EUserAndExpectDashboard,
} from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

async function expectInviteActionOrFinalState(
  page: import('@playwright/test').Page,
  allowInvalidFinalState: boolean = false
): Promise<void> {
  await expect(page.getByRole('heading', { name: /bucket admin invitation/i })).toBeVisible();
  const acceptButton = page.getByRole('button', { name: /accept/i });
  const declineButton = page.getByRole('button', { name: /decline|reject/i });
  const finalStatePattern = allowInvalidFinalState
    ? /already admin|you are owner|accepted|declined|rejected|invalid/i
    : /already admin|you are owner|accepted|declined|rejected/i;
  const finalState = page.getByText(finalStatePattern).first();

  await expect
    .poll(async () => {
      const hasAccept = await acceptButton.isVisible().catch(() => false);
      const hasDeclineOrReject = await declineButton.isVisible().catch(() => false);
      const hasFinalState = await finalState.isVisible().catch(() => false);
      return (hasAccept && hasDeclineOrReject) || hasFinalState;
    })
    .toBe(true);
}

async function createInvitationToken(page: import('@playwright/test').Page): Promise<string> {
  await loginAsWebE2EUserAndExpectDashboard(page);
  await page.goto('/bucket/e2ebkt000001/settings/roles/new');
  await expect(page.getByRole('textbox', { name: /role name|name/i })).toBeVisible();
  await page
    .getByRole('textbox', { name: /role name|name/i })
    .fill(`e2e-invite-role-${Date.now()}`);
  await page.getByRole('button', { name: /save|create/i }).click();
  await expect(page).toHaveURL(/\/bucket\/e2ebkt000001\/settings\?tab=roles/);

  await page.goto('/bucket/e2ebkt000001/settings?tab=admins');
  await expect(page.getByRole('button', { name: /add admin/i })).toBeVisible();
  await page.getByRole('button', { name: /add admin/i }).click();
  const inviteInput = page
    .getByRole('textbox', { name: /invite link|invitation/i })
    .or(page.locator('input[value*="/invite/"]'))
    .first();
  await expect(inviteInput).toBeVisible();
  const inviteUrl = await inviteInput.inputValue();
  const tokenMatch = inviteUrl.match(/\/invite\/([^/?#]+)/);
  if (tokenMatch === null || tokenMatch[1] === undefined || tokenMatch[1] === '') {
    throw new Error(`Failed to extract invitation token from URL: ${inviteUrl}`);
  }
  return tokenMatch[1];
}

test.describe('Invite-page for the basic-user', () => {
  test('When the basic-user opens the invite-page with an invalid token, they see the invalid state.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    await loginAsWebE2ENonAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User logs in and navigates to an invalid invite token; invalid state is shown.',
      async () => {
        await page.goto('/invite/invalid-token-99999');
        await expect(page).toHaveURL(/\/invite\/invalid-token-99999/);
        await expect(
          page.getByText(/invitation not found|invalid|no longer valid|failed to load/i)
        ).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The invite-page shows invalid state for the basic-user with an invalid token.'
    );
  });

  test('When the basic-user opens the invite-page with a valid token, they see accept or reject actions.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'basic-user');
    const token = await createInvitationToken(page);
    await page.context().clearCookies();
    await loginAsWebE2ENonAdmin(page);

    await actionAndCapture(
      page,
      testInfo,
      'User opens a valid invite while authenticated as basic-user and sees accept or reject actions.',
      async () => {
        await page.goto(`/invite/${token}`);
        await expect(page).toHaveURL(new RegExp(`/invite/${token}`));
        await expectInviteActionOrFinalState(page);
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The invite-page shows accept/reject or final state for the basic-user.'
    );
  });
});
