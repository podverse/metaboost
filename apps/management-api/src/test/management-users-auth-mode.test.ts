process.env.AUTH_MODE = 'user_signup_email';

import type { Express } from 'express';
import type request from 'supertest';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'mgmt-users-auth-mode';

describe('management users in user_signup_email mode', () => {
  let app: Express;
  let API: string;
  let superAdminAgent: ReturnType<typeof request.agent>;

  const superAdminUsername = `${FILE_PREFIX}-super-admin`;
  const superAdminPassword = `${FILE_PREFIX}-super-admin-password-1`;

  beforeAll(async () => {
    const configMod = await import('../config/index.js');
    const setupMod = await import('./helpers/setup.js');
    const loginAgentMod = await import('./helpers/login-agent.js');
    API = configMod.config.apiVersionPath;
    app = await setupMod.createManagementApiTestAppWithSuperAdmin(
      superAdminUsername,
      superAdminPassword
    );
    superAdminAgent = await loginAgentMod.createManagementLoginAgent(app, {
      username: superAdminUsername,
      password: superAdminPassword,
    });
  });

  afterAll(async () => {
    const setupMod = await import('./helpers/setup.js');
    await setupMod.destroyManagementApiTestDataSources();
  });

  it('POST /users returns 400 without password when invitation links are disabled', async () => {
    await superAdminAgent
      .post(`${API}/users`)
      .send({
        username: `${FILE_PREFIX}-no-password-${Date.now()}`,
        displayName: 'No Password User',
      })
      .expect(400, { message: 'Password is required when invitation links are disabled' });
  });

  it('POST /users with password succeeds and does not return setPasswordLink', async () => {
    const email = `${FILE_PREFIX}-user-${Date.now()}@example.com`;
    const password = `${FILE_PREFIX}-user-password-1`;
    const res = await superAdminAgent
      .post(`${API}/users`)
      .send({ email, password, displayName: 'Mode User' })
      .expect(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.setPasswordLink).toBeUndefined();
    await superAdminAgent.delete(`${API}/users/${res.body.user.id}`).expect(204);
  });
});
