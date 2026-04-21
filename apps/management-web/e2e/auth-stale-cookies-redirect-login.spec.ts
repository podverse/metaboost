import { expect, test } from '@playwright/test';

import { capturePageLoad } from './helpers/stepScreenshots';

test.describe('Management web stale session cookies', () => {
  test('When bogus session cookies are sent, protected routes redirect to login instead of treating the cookie as an authenticated session.', async ({
    page,
    context,
    baseURL,
  }, testInfo) => {
    const origin = baseURL ?? 'http://localhost:4112';
    const { hostname } = new URL(origin);
    await context.addCookies([
      {
        name: 'management_api_session',
        value: 'bogus-access-token-not-valid',
        domain: hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'management_api_refresh',
        value: 'bogus-refresh-token-not-valid',
        domain: hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/dashboard');
    await expect.poll(() => new URL(page.url()).pathname).toBe('/login');
    await capturePageLoad(
      page,
      testInfo,
      'User with invalid session cookies lands on login after attempting the dashboard.'
    );
    await expect(page.getByRole('textbox', { name: /username|email/i })).toBeVisible();
  });
});
