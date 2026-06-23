import { expect, test } from '@playwright/test';

import { getE2EApiV1BaseUrl } from './helpers/apiBase';
import { capturePageLoad } from './helpers/stepScreenshots';

test.describe('Web stale session cookies', () => {
  test('When bogus session cookies are sent, protected routes redirect to login and login does not bounce to dashboard.', async ({
    page,
    context,
    baseURL,
  }, testInfo) => {
    const origin = baseURL ?? 'http://localhost:4012';
    const { hostname } = new URL(origin);
    await context.addCookies([
      {
        name: 'api_session',
        value: 'bogus-access-token-not-valid',
        domain: hostname,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
      {
        name: 'api_refresh',
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
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    await page.goto('/login');
    await expect.poll(() => new URL(page.url()).pathname).toBe('/login');
    await capturePageLoad(
      page,
      testInfo,
      'Login stays on login when session cookies are invalid and not treated as authenticated.'
    );
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
  });

  test('Unauthenticated API /auth/me returns 401 (E2E uses direct API origin, not web /v1 rewrite).', async ({
    request,
  }) => {
    const response = await request.get(`${getE2EApiV1BaseUrl()}/auth/me`);
    expect(response.status()).toBe(401);
    expect(response.url()).toContain('/v1/auth/me');
  });
});
