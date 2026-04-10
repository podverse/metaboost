import type { APIRequestContext, Page } from '@playwright/test';

import { expect } from '@playwright/test';

const MANAGEMENT_LOGIN_PASSWORD = 'Test!1Aa';

/** E2E management users (from tools/management-web/seed-e2e.mjs). Same password for all: Test!1Aa */
export const E2E_MANAGEMENT_SUPER_ADMIN_USERNAME = 'e2e-superadmin';
export const E2E_MANAGEMENT_LIMITED_ADMIN_USERNAME = 'e2e-limitedadmin';
export const E2E_MANAGEMENT_ADMIN_BUCKET_ADMINS_USERNAME = 'e2e-admin-bucket-admins';
export const E2E_MANAGEMENT_ADMIN_NO_BUCKET_ADMINS_USERNAME = 'e2e-admin-no-bucket-admins';

export const nextFixtureName = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Returns a Cookie header string from the page context for use in same-origin API requests. */
export async function getCookieHeaderFromPage(page: Page): Promise<string> {
  const cookies = await page.context().cookies();
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}

const LOGIN_REDIRECT_TIMEOUT_MS = 10_000;

async function loginAsManagementUser(page: Page, username: string): Promise<void> {
  await page.goto('/login');
  await expect(page.getByRole('textbox', { name: /username|email/i })).toBeVisible();
  await page.getByRole('textbox', { name: /username|email/i }).fill(username);
  await page.getByLabel(/password/i).fill(MANAGEMENT_LOGIN_PASSWORD);

  const loginResponsePromise = page.waitForResponse(
    (res) =>
      res.request().method() === 'POST' &&
      (res.url().includes('/auth/login') || res.url().includes('auth/login')),
    { timeout: LOGIN_REDIRECT_TIMEOUT_MS }
  );

  await page.getByRole('button', { name: /log in|sign in|submit/i }).click();

  const loginResponse = await loginResponsePromise;
  const status = loginResponse.status();
  let responseBodySnippet = '';
  try {
    const text = await loginResponse.text();
    responseBodySnippet = text.length > 200 ? `${text.slice(0, 200)}…` : text;
  } catch {
    // ignore body read errors
  }

  try {
    await expect(page).toHaveURL(/\/dashboard/, { timeout: LOGIN_REDIRECT_TIMEOUT_MS });
  } catch (err) {
    const currentUrl = page.url();
    const extra = [
      `current URL: ${currentUrl}`,
      `login response status: ${status}`,
      responseBodySnippet !== '' ? `login response body (snippet): ${responseBodySnippet}` : '',
    ]
      .filter(Boolean)
      .join('; ');
    throw new Error(
      `Management login did not redirect to /dashboard (username: ${username}). ${extra}`,
      { cause: err }
    );
  }
}

export async function loginAsManagementSuperAdmin(page: Page): Promise<void> {
  await loginAsManagementUser(page, E2E_MANAGEMENT_SUPER_ADMIN_USERNAME);
}

/** Admin (admins users events:own): no buckets, no bucket_admins, event_visibility own. Use for restricted-route tests. */
export async function loginAsLimitedAdmin(page: Page): Promise<void> {
  await loginAsManagementUser(page, E2E_MANAGEMENT_LIMITED_ADMIN_USERNAME);
}

/** Admin (buckets:R bucket_admins events:all_admins): can open bucket-admin-edit and edit non-owner rows. */
export async function loginAsManagementAdminWithBucketAdmins(page: Page): Promise<void> {
  await loginAsManagementUser(page, E2E_MANAGEMENT_ADMIN_BUCKET_ADMINS_USERNAME);
}

/** Admin (buckets:R events:all_admins): bucket-admin-edit route shows not found. */
export async function loginAsManagementAdminWithoutBucketAdmins(page: Page): Promise<void> {
  await loginAsManagementUser(page, E2E_MANAGEMENT_ADMIN_NO_BUCKET_ADMINS_USERNAME);
}

export async function createChildBucketFixture(
  request: APIRequestContext,
  parentBucketId: string
): Promise<{ id: string; shortId: string; name: string }> {
  const name = nextFixtureName('e2e-child-bucket');
  const endpoint = `/api/management/v1/buckets/${parentBucketId}/buckets`;
  const response = await request.post(endpoint, {
    data: { name, isPublic: true },
  });
  if (!response.ok()) {
    const responseText = await response.text();
    throw new Error(
      `Failed to create child bucket fixture at ${endpoint}: ${response.status()} ${response.statusText()}${responseText !== '' ? ` | ${responseText.slice(0, 300)}` : ''}`
    );
  }
  const data = (await response.json()) as {
    bucket?: { id: string; shortId?: string; name?: string };
  };
  const bucket = data.bucket;
  if (bucket === undefined || typeof bucket.id !== 'string') {
    throw new Error('Child bucket fixture response missing bucket id');
  }
  return {
    id: bucket.id,
    shortId: typeof bucket.shortId === 'string' ? bucket.shortId : bucket.id,
    name: typeof bucket.name === 'string' ? bucket.name : name,
  };
}

export async function createBucketRoleFixture(
  request: APIRequestContext,
  bucketId: string
): Promise<{ id: string; name: string }> {
  const name = nextFixtureName('e2e-bucket-role');
  const endpoint = `/api/management/v1/buckets/${bucketId}/roles`;
  const response = await request.post(endpoint, {
    data: { name, bucketCrud: 2, bucketMessagesCrud: 2, bucketAdminsCrud: 2 },
  });
  if (!response.ok()) {
    const responseText = await response.text();
    throw new Error(
      `Failed to create bucket role fixture at ${endpoint}: ${response.status()} ${response.statusText()}${responseText !== '' ? ` | ${responseText.slice(0, 300)}` : ''}`
    );
  }
  const data = (await response.json()) as { role?: { id: string; name?: string } };
  const role = data.role;
  if (role === undefined || typeof role.id !== 'string') {
    throw new Error('Bucket role fixture response missing role id');
  }
  return { id: role.id, name: typeof role.name === 'string' ? role.name : name };
}

export async function createBucketMessageFixture(
  request: APIRequestContext,
  bucketId: string,
  body: { body: string; senderName: string; isPublic?: boolean },
  options?: { cookieHeader: string }
): Promise<{ id: string }> {
  const headers =
    options?.cookieHeader !== undefined ? { Cookie: options.cookieHeader } : undefined;
  const endpoint = `/api/management/v1/buckets/${bucketId}/messages`;
  const response = await request.post(endpoint, {
    data: { body: body.body, senderName: body.senderName, isPublic: body.isPublic ?? true },
    headers,
  });
  if (!response.ok()) {
    const responseText = await response.text();
    throw new Error(
      `Failed to create bucket message fixture at ${endpoint}: ${response.status()} ${response.statusText()}${responseText !== '' ? ` | ${responseText.slice(0, 300)}` : ''}`
    );
  }
  const data = (await response.json()) as { message?: { id: string } };
  const message = data.message;
  if (message === undefined || typeof message.id !== 'string') {
    throw new Error('Bucket message fixture response missing message id');
  }
  return { id: message.id };
}

export async function createAdminRoleFixture(
  request: APIRequestContext
): Promise<{ id: string; name: string }> {
  const name = nextFixtureName('e2e-admin-role');
  const endpoint = '/api/management/v1/admin-roles';
  const response = await request.post(endpoint, {
    data: {
      name,
      adminsCrud: 2,
      usersCrud: 2,
      bucketsCrud: 2,
      bucketMessagesCrud: 2,
      bucketAdminsCrud: 2,
      eventVisibility: 'all_admins',
    },
  });
  if (!response.ok()) {
    const responseText = await response.text();
    throw new Error(
      `Failed to create admin role fixture at ${endpoint}: ${response.status()} ${response.statusText()}${responseText !== '' ? ` | ${responseText.slice(0, 300)}` : ''}`
    );
  }
  const data = (await response.json()) as { role?: { id: string; name?: string } };
  const role = data.role;
  if (role === undefined || typeof role.id !== 'string') {
    throw new Error('Admin role fixture response missing role id');
  }
  return { id: role.id, name: typeof role.name === 'string' ? role.name : name };
}
