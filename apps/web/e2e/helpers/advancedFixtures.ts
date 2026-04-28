import type { APIRequestContext, Page, TestInfo } from '@playwright/test';

import { expect } from '@playwright/test';

import { getE2EApiV1BaseUrl } from './apiBase';
import { actionAndCapture } from './stepScreenshots';

const WEB_LOGIN_EMAIL = 'e2e-bucket-owner@example.com';
const WEB_LOGIN_PASSWORD = 'Test!1Aa';
const WEB_E2E_ADMIN_WITH_PERMISSION_EMAIL = 'e2e-bucket-admin@example.com';
const WEB_E2E_ADMIN_WITHOUT_PERMISSION_EMAIL = 'e2e-admin-without-permission@example.com';
const WEB_E2E_NON_ADMIN_EMAIL = 'e2e-non-admin@example.com';

export const nextFixtureName = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * After /dashboard load, the buckets table and column headers are visible (there is no top-level "Dashboard" heading).
 * Sortable columns use Table.SortableHeaderCell: the inner button's aria-label is "Sort by {label}. ...", so the
 * columnheader name is not the bare label. Match a substring, not ^label$.
 */
export async function expectPostLoginDashboardVisible(page: Page): Promise<void> {
  await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /type/i })).toBeVisible();
}

async function loginWithEmailAndExpectDashboard(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
  await page.getByRole('textbox', { name: /email|username/i }).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expectPostLoginDashboardVisible(page);
}

export async function loginAsWebE2EUserAndExpectDashboard(page: Page): Promise<void> {
  await loginWithEmailAndExpectDashboard(page, WEB_LOGIN_EMAIL, WEB_LOGIN_PASSWORD);
}

export async function loginAsWebE2EUser(page: Page): Promise<void> {
  await loginAsWebE2EUserAndExpectDashboard(page);
}

/** Log in as non-owner-admin with bucket-admins permission (e2e-bucket-admin@example.com). */
export async function loginAsWebE2EAdminWithPermission(page: Page): Promise<void> {
  await loginWithEmailAndExpectDashboard(
    page,
    WEB_E2E_ADMIN_WITH_PERMISSION_EMAIL,
    WEB_LOGIN_PASSWORD
  );
}

/** Log in as non-owner-admin without bucket update (e2e-admin-without-permission@example.com). */
export async function loginAsWebE2EAdminWithoutPermission(page: Page): Promise<void> {
  await loginWithEmailAndExpectDashboard(
    page,
    WEB_E2E_ADMIN_WITHOUT_PERMISSION_EMAIL,
    WEB_LOGIN_PASSWORD
  );
}

/** Log in as user with no bucket_admin row for E2E Bucket One (e2e-non-admin@example.com). */
export async function loginAsWebE2ENonAdmin(page: Page): Promise<void> {
  await loginWithEmailAndExpectDashboard(page, WEB_E2E_NON_ADMIN_EMAIL, WEB_LOGIN_PASSWORD);
}

export async function expectUnauthedRouteRedirectsToLogin(
  page: Page,
  route: string,
  stepLabel: string,
  testInfo: TestInfo
): Promise<void> {
  await actionAndCapture(page, testInfo, stepLabel, async () => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('textbox', { name: /email|username/i })).toBeVisible();
  });
}

export async function createChildBucketFixture(
  request: APIRequestContext,
  parentBucketIdText: string
): Promise<{ id: string; idText: string; name: string }> {
  const name = nextFixtureName('e2e-web-child-bucket');
  const response = await request.post(
    `${getE2EApiV1BaseUrl()}/buckets/${parentBucketIdText}/buckets`,
    {
      data: { name, isPublic: true },
    }
  );
  if (!response.ok()) {
    throw new Error(
      `Failed to create child bucket fixture: ${response.status()} ${response.statusText()}`
    );
  }
  const data = (await response.json()) as {
    bucket?: { id: string; idText?: string; name?: string };
  };
  const bucket = data.bucket;
  if (bucket === undefined || typeof bucket.id !== 'string') {
    throw new Error('Child bucket fixture response missing bucket id');
  }
  return {
    id: bucket.id,
    idText: typeof bucket.idText === 'string' ? bucket.idText : bucket.id,
    name: typeof bucket.name === 'string' ? bucket.name : name,
  };
}

export async function createBucketRoleFixture(
  request: APIRequestContext,
  bucketIdText: string
): Promise<{ id: string; name: string }> {
  const name = nextFixtureName('e2e-web-bucket-role');
  const response = await request.post(`${getE2EApiV1BaseUrl()}/buckets/${bucketIdText}/roles`, {
    data: { name, bucketCrud: 2, bucketMessagesCrud: 2, bucketAdminsCrud: 2 },
  });
  if (!response.ok()) {
    throw new Error(
      `Failed to create bucket role fixture: ${response.status()} ${response.statusText()}`
    );
  }
  const data = (await response.json()) as { role?: { id: string; name?: string } };
  const role = data.role;
  if (role === undefined || typeof role.id !== 'string') {
    throw new Error('Bucket role fixture response missing role id');
  }
  return { id: role.id, name: typeof role.name === 'string' ? role.name : name };
}

export async function createAdminInvitationFixture(
  request: APIRequestContext,
  bucketIdText: string,
  email: string
): Promise<{ token: string }> {
  const response = await request.post(
    `${getE2EApiV1BaseUrl()}/buckets/${bucketIdText}/invitations`,
    {
      data: { email, bucketCrud: 2, bucketMessagesCrud: 2 },
    }
  );
  if (!response.ok()) {
    throw new Error(
      `Failed to create admin invitation fixture: ${response.status()} ${response.statusText()}`
    );
  }
  const data = (await response.json()) as { invitation?: { token?: string } };
  const token = data.invitation?.token;
  if (typeof token !== 'string' || token === '') {
    throw new Error('Admin invitation fixture response missing token');
  }
  return { token };
}
