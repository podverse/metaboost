process.env.AUTH_MODE = 'admin_only_username';

import type { Express } from 'express';

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { UserService, VerificationTokenService } from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';
import { generateToken, getSetPasswordExpiry, hashToken } from '../lib/auth/verification-token.js';

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-set-password-username';

describe('set-password in admin_only_username mode', () => {
  let app: Express;
  let API: string;

  beforeAll(async () => {
    const configMod = await import('../config/index.js');
    const setupMod = await import('./helpers/setup.js');
    API = configMod.config.apiVersionPath;
    app = await setupMod.createApiTestApp();
  });

  afterAll(async () => {
    const setupMod = await import('./helpers/setup.js');
    await setupMod.destroyApiTestDataSources();
  });

  it('POST /auth/set-password requires username', async () => {
    const user = await UserService.create({
      email: `${FILE_PREFIX}-no-username-${Date.now()}@example.com`,
      password: await hashPassword('placeholder-password-1'),
      displayName: null,
    });
    const rawToken = generateToken();
    await VerificationTokenService.createToken(
      user.id,
      'set_password',
      hashToken(rawToken),
      getSetPasswordExpiry(),
      null
    );

    await request(app)
      .post(`${API}/auth/set-password`)
      .send({ token: rawToken, newPassword: 'new-password-1' })
      .expect(400);
  });

  it('POST /auth/set-password updates username and password, and token is single-use', async () => {
    const user = await UserService.create({
      email: `${FILE_PREFIX}-success-${Date.now()}@example.com`,
      password: await hashPassword('placeholder-password-2'),
      displayName: null,
    });
    const rawToken = generateToken();
    await VerificationTokenService.createToken(
      user.id,
      'set_password',
      hashToken(rawToken),
      getSetPasswordExpiry(),
      null
    );
    const username = `${FILE_PREFIX}-invited-${Date.now()}`;
    const newPassword = 'new-password-2';

    await request(app)
      .post(`${API}/auth/set-password`)
      .send({
        token: rawToken,
        newPassword,
        username,
      })
      .expect(204);

    const updated = await UserService.findById(user.id);
    expect(updated?.credentials.username).toBe(username);

    await request(app)
      .post(`${API}/auth/login`)
      .send({ email: username, password: newPassword })
      .expect(200);

    await request(app)
      .post(`${API}/auth/set-password`)
      .send({
        token: rawToken,
        newPassword: 'new-password-3',
        username: `${FILE_PREFIX}-other-${Date.now()}`,
      })
      .expect(400, { message: 'Invalid or expired link' });
  });

  it('POST /auth/set-password enforces username uniqueness and keeps token usable after 409', async () => {
    const takenUsername = `${FILE_PREFIX}-taken-${Date.now()}`;
    await UserService.create({
      email: `${FILE_PREFIX}-taken-owner-${Date.now()}@example.com`,
      username: takenUsername,
      password: await hashPassword('taken-password-1'),
      displayName: null,
    });
    const user = await UserService.create({
      email: `${FILE_PREFIX}-conflict-${Date.now()}@example.com`,
      password: await hashPassword('placeholder-password-4'),
      displayName: null,
    });
    const rawToken = generateToken();
    await VerificationTokenService.createToken(
      user.id,
      'set_password',
      hashToken(rawToken),
      getSetPasswordExpiry(),
      null
    );

    await request(app)
      .post(`${API}/auth/set-password`)
      .send({
        token: rawToken,
        newPassword: 'new-password-4',
        username: takenUsername,
      })
      .expect(409, { message: 'Username already in use' });

    const finalUsername = `${FILE_PREFIX}-final-${Date.now()}`;
    await request(app)
      .post(`${API}/auth/set-password`)
      .send({
        token: rawToken,
        newPassword: 'new-password-5',
        username: finalUsername,
      })
      .expect(204);

    await request(app)
      .post(`${API}/auth/login`)
      .send({ email: finalUsername, password: 'new-password-5' })
      .expect(200);
  });
});
