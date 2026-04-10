import { expect, test } from '@playwright/test';

import { loginAsManagementSuperAdmin, nextFixtureName } from './helpers/advancedFixtures';
import { actionAndCapture, capturePageLoad } from './helpers/stepScreenshots';
import { setE2EUserContext } from './helpers/userContext';

test.describe('Management users-new-page for the super-admin user', () => {
  test('When a permitted user (super-admin) opens the users-new-page, they see the add-user-form.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await actionAndCapture(
      page,
      testInfo,
      'User navigates to the management users-new-route and sees the add-user form.',
      async () => {
        await page.goto('/users/new');
        await expect(page).toHaveURL(/\/users\/new/);
        await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
        await expect(page.getByRole('textbox', { name: /username/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /add user|create|save/i })).toBeVisible();
      }
    );
    await capturePageLoad(
      page,
      testInfo,
      'The management add-user-form is visible with email, username and submit button.'
    );
  });

  test('When the user clicks Cancel on the add-user-form, they are returned to the users-list-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/users/new');
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User clicks Cancel on the add-user-form and is taken to the users-list-page.',
      async () => {
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page).toHaveURL(/\/users(\?|$)/);
      }
    );
    await capturePageLoad(page, testInfo, 'The users-list-page is visible after Cancel.');
  });

  test('When the user submits the add-user-form without required fields, validation is shown and they remain on the users-new-page.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/users/new');
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    await actionAndCapture(
      page,
      testInfo,
      'User submits the empty add-user-form and sees validation.',
      async () => {
        await page.getByRole('button', { name: /create user|create|save|add user/i }).click();
        await expect(page).toHaveURL(/\/users\/new$/);
        await expect(page.getByText(/required|email|username/i).first()).toBeVisible();
      }
    );
  });

  test('When the user submits a valid add-user-form, either a success state is shown or they are returned to the users list with the new user visible.', async ({
    page,
  }, testInfo) => {
    setE2EUserContext(testInfo, 'super-admin');
    await loginAsManagementSuperAdmin(page);
    await page.goto('/users/new');
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    const email = `${nextFixtureName('e2e-mgmt-user')}@example.com`;
    await page.getByRole('textbox', { name: /email/i }).fill(email);

    await actionAndCapture(
      page,
      testInfo,
      'User submits the valid add-user-form and sees success state or is taken to the users list.',
      async () => {
        await page.getByRole('button', { name: /create user|create|save|add user/i }).click();
      }
    );

    const currentPath = new URL(page.url()).pathname;
    if (currentPath === '/users/new') {
      await expect(page.getByText(/user created|set-password link/i).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /back to users/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /copy link|link copied/i })).toBeVisible();
      await capturePageLoad(
        page,
        testInfo,
        'The users-new-page shows success state with set-password link.'
      );
      return;
    }

    await expect(page).toHaveURL(/\/users(\?|$)/);
    await page.goto(`/users?search=${encodeURIComponent(email)}`);
    await expect(page.getByText(new RegExp(email, 'i')).first()).toBeVisible();
    await capturePageLoad(
      page,
      testInfo,
      'The users-list-page shows the newly created user after submit.'
    );
  });
});
