import type { Express } from 'express';

import request from 'supertest';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { UserService, VerificationTokenService } from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';
import { generateToken, getSetPasswordExpiry, hashToken } from '../lib/auth/verification-token.js';
import {
  applyAdminOnlyEmailApiTestProcessEnv,
  restoreDefaultApiTestProcessEnv,
} from './helpers/apiTestAuthEnv.js';

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-set-password-email';

describe('set-password in admin_only_email mode', () => {
  let app: Express;
  let API: string;

  beforeAll(async () => {
    applyAdminOnlyEmailApiTestProcessEnv();
    const configMod = await import('../config/index.js');
    const setupMod = await import('./helpers/setup.js');
    API = configMod.config.apiVersionPath;
    app = await setupMod.createApiTestApp();
  });

  afterAll(async () => {
    const setupMod = await import('./helpers/setup.js');
    await setupMod.destroyApiTestDataSources();
    restoreDefaultApiTestProcessEnv();
  });

  it('POST /auth/set-password requires both email and username', async () => {
    const user = await UserService.create({
      username: `${FILE_PREFIX}-required-${Date.now()}`,
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
      .send({
        token: rawToken,
        newPassword: 'new-password-1',
        username: `${FILE_PREFIX}-new-u-${Date.now()}`,
      })
      .expect(400);

    await request(app)
      .post(`${API}/auth/set-password`)
      .send({
        token: rawToken,
        newPassword: 'new-password-1',
        email: `${FILE_PREFIX}-new-email-${Date.now()}@example.com`,
      })
      .expect(400);
  });

  it('POST /auth/set-password updates email, username, and password', async () => {
    const user = await UserService.create({
      username: `${FILE_PREFIX}-success-${Date.now()}`,
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
    const nextEmail = `${FILE_PREFIX}-final-${Date.now()}@example.com`;
    const nextUsername = `${FILE_PREFIX}-fin-${Date.now()}`;
    const nextPassword = 'new-password-2';

    await request(app)
      .post(`${API}/auth/set-password`)
      .send({
        token: rawToken,
        newPassword: nextPassword,
        email: nextEmail,
        username: nextUsername,
      })
      .expect(204);

    await request(app)
      .post(`${API}/auth/login`)
      .send({ email: nextEmail, password: nextPassword })
      .expect(200);

    await request(app)
      .post(`${API}/auth/login`)
      .send({ email: nextUsername, password: nextPassword })
      .expect(200);
  });

  it('POST /auth/set-password enforces uniqueness and keeps token usable after 409', async () => {
    const takenEmail = `${FILE_PREFIX}-taken-email-${Date.now()}@example.com`;
    const takenUsername = `${FILE_PREFIX}-tkn-${Date.now()}`;
    await UserService.create({
      email: takenEmail,
      username: takenUsername,
      password: await hashPassword('taken-password-1'),
      displayName: null,
    });
    const invitedUser = await UserService.create({
      username: `${FILE_PREFIX}-conflict-${Date.now()}`,
      password: await hashPassword('placeholder-password-3'),
      displayName: null,
    });
    const rawToken = generateToken();
    await VerificationTokenService.createToken(
      invitedUser.id,
      'set_password',
      hashToken(rawToken),
      getSetPasswordExpiry(),
      null
    );

    await request(app)
      .post(`${API}/auth/set-password`)
      .send({
        token: rawToken,
        newPassword: 'new-password-3',
        email: takenEmail,
        username: `${FILE_PREFIX}-fr-${Date.now()}`,
      })
      .expect(409, { message: 'Email already in use' });

    await request(app)
      .post(`${API}/auth/set-password`)
      .send({
        token: rawToken,
        newPassword: 'new-password-3',
        email: `${FILE_PREFIX}-fresh-email-${Date.now()}@example.com`,
        username: takenUsername,
      })
      .expect(409, { message: 'Username already in use' });

    const finalEmail = `${FILE_PREFIX}-retry-${Date.now()}@example.com`;
    const finalUsername = `${FILE_PREFIX}-retry-${Date.now()}`;
    await request(app)
      .post(`${API}/auth/set-password`)
      .send({
        token: rawToken,
        newPassword: 'new-password-4',
        email: finalEmail,
        username: finalUsername,
      })
      .expect(204);

    await request(app)
      .post(`${API}/auth/login`)
      .send({ email: finalEmail, password: 'new-password-4' })
      .expect(200);
  });
});
