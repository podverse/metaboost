import request from 'supertest';
/**
 * API integration tests: auth endpoints unaffected by mailer mode.
 * Covers login, logout, me, change-password.
 * For root routes see root-routes.test.ts; for mode-specific flows see auth-no-mailer.test.ts and auth-mailer.test.ts.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AUTH_MESSAGE_INVALID_CREDENTIALS } from '@metaboost/helpers';
import {
  appDataSourceReadWrite,
  TermsVersion,
  UserService,
  UserTermsAcceptanceService,
} from '@metaboost/orm';

import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { restoreDefaultApiTestProcessEnv } from './helpers/apiTestAuthEnv.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'auth-shared';

describe('auth (shared)', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let API: string;
  let sessionCookieName: string;
  let refreshCookieName: string;
  const testUserEmail = `${FILE_PREFIX}-${Date.now()}@example.com`;
  const testUserPassword = `${FILE_PREFIX}-password-1`;

  beforeAll(async () => {
    restoreDefaultApiTestProcessEnv();
    const { config } = await import('../config/index.js');
    API = config.apiVersionPath;
    sessionCookieName = config.sessionCookieName;
    refreshCookieName = config.refreshCookieName;
    app = await createApiTestApp();
    const hashed = await hashPassword(testUserPassword);
    await UserService.create({
      email: testUserEmail,
      password: hashed,
      displayName: 'Test User',
    });
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
    restoreDefaultApiTestProcessEnv();
  });

  describe('POST /auth/login', () => {
    it('returns 400 when email or password missing', async () => {
      await request(app).post(`${API}/auth/login`).send({}).expect(400);
      await request(app).post(`${API}/auth/login`).send({ email: 'a@b.com' }).expect(400);
      await request(app).post(`${API}/auth/login`).send({ password: 'x' }).expect(400);
    });

    it('returns 401 for unknown email', async () => {
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: 'unknown@example.com', password: 'any' })
        .expect(401, { message: AUTH_MESSAGE_INVALID_CREDENTIALS });
    });

    it('returns 401 for wrong password', async () => {
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: 'wrong-password' })
        .expect(401, { message: AUTH_MESSAGE_INVALID_CREDENTIALS });
    });

    it('returns 200 with user and Set-Cookie (no token in body) for valid credentials', async () => {
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: testUserPassword })
        .expect(200);
      expect(res.body).not.toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(testUserEmail);
      expect(res.body.user.displayName).toBe('Test User');
      expect(res.body.user.hasAcceptedLatestTerms).toBe(false);
      expect(
        [
          res.body.user.currentTerms.enforcementStartsAt,
          res.body.user.upcomingTerms?.enforcementStartsAt ?? null,
        ].includes(res.body.user.termsEnforcementStartsAt)
      ).toBe(true);
      expect(typeof res.body.user.currentTermsVersionKey).toBe('string');
      expect(res.body.user.currentTermsVersionKey).not.toBe('');
      expect(['pre_announcement', 'announcement', 'enforced']).toContain(
        res.body.user.termsPolicyPhase
      );
      expect(typeof res.body.user.mustAcceptTermsNow).toBe('boolean');
      expect(typeof res.body.user.needsUpcomingTermsAcceptance).toBe('boolean');
      expect(res.body.user.currentTerms.status).toBe('current');
      if (res.body.user.upcomingTerms !== null) {
        expect(res.body.user.upcomingTerms.status).toBe('upcoming');
      }
      expect(res.body.user.termsAcceptedAt).toBeNull();
      const setCookie = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      expect(cookies.length).toBeGreaterThanOrEqual(2);
      expect(cookies.some((c: string) => c.startsWith(sessionCookieName + '='))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith(refreshCookieName + '='))).toBe(true);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 204 without auth', async () => {
      await request(app).post(`${API}/auth/logout`).expect(204);
    });

    it('returns 204 and clears cookies when authenticated', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const res = await agent.post(`${API}/auth/logout`).expect(204);
      const setCookie = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      const sessionCleared = cookies.some(
        (c: string) => c.startsWith(sessionCookieName + '=;') || c.includes('Max-Age=0')
      );
      const refreshCleared = cookies.some(
        (c: string) => c.startsWith(refreshCookieName + '=;') || c.includes('Max-Age=0')
      );
      expect(sessionCleared).toBe(true);
      expect(refreshCleared).toBe(true);
    });
  });

  describe('GET /auth/me', () => {
    it('returns 401 without cookie or Authorization', async () => {
      await request(app).get(`${API}/auth/me`).expect(401);
    });

    it('returns 401 with invalid Bearer token', async () => {
      await request(app)
        .get(`${API}/auth/me`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('returns 200 with user when authenticated via Bearer token', async () => {
      const loginRes = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: testUserPassword })
        .expect(200);
      const setCookie: string[] | string | undefined = loginRes.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      const sessionCookie = cookies.find((c: string) => c.startsWith(sessionCookieName + '='));
      expect(sessionCookie).toBeDefined();
      if (sessionCookie === undefined) return;
      const token = sessionCookie.split(';')[0].split('=').slice(1).join('=');
      const res = await request(app)
        .get(`${API}/auth/me`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.user.email).toBe(testUserEmail);
    });

    it('returns 200 with user when authenticated via cookie', async () => {
      const loginRes = await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: testUserPassword });
      expect(
        loginRes.status,
        `Expected login to succeed before cookie-auth /auth/me check, received status ${loginRes.status} with body ${JSON.stringify(loginRes.body)}`
      ).toBe(200);
      const setCookie = loginRes.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      expect(cookies.length).toBeGreaterThan(0);
      const cookieHeader = cookies.map((cookie) => cookie.split(';')[0]).join('; ');
      expect(cookieHeader).not.toBe('');
      const res = await request(app).get(`${API}/auth/me`).set('Cookie', cookieHeader).expect(200);
      expect(res.body.user.email).toBe(testUserEmail);
      expect(res.body.user.hasAcceptedLatestTerms).toBe(false);
      expect(res.body.user.mustAcceptTermsNow).toBe(true);
    });

    it('promotes overdue upcoming terms to current during /auth/me and keeps latest-acceptance required', async () => {
      const termsVersionRepo = appDataSourceReadWrite.getRepository(TermsVersion);
      await termsVersionRepo
        .createQueryBuilder()
        .update(TermsVersion)
        .set({ status: 'deprecated' })
        .where('status = :status', { status: 'upcoming' })
        .execute();

      const previousCurrent = await termsVersionRepo.findOneByOrFail({ status: 'current' });
      const now = Date.now();
      const overdueUpcoming = await termsVersionRepo.save(
        termsVersionRepo.create({
          versionKey: `overdue-upcoming-${now}`,
          title: `Overdue Upcoming Terms ${now}`,
          contentHash: `overdue-upcoming-hash-${now}`,
          content: {
            contentTextEnUs: `Overdue upcoming terms content ${now}`,
            contentTextEs: `Contenido de términos vencidos ${now}`,
          },
          announcementStartsAt: new Date(now - 180_000),
          enforcementStartsAt: new Date(now - 60_000),
          status: 'upcoming',
        })
      );

      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const meRes = await agent.get(`${API}/auth/me`).expect(200);

      const promoted = await termsVersionRepo.findOneByOrFail({ id: overdueUpcoming.id });
      const deprecated = await termsVersionRepo.findOneByOrFail({ id: previousCurrent.id });
      expect(promoted.status).toBe('current');
      expect(deprecated.status).toBe('deprecated');
      expect(meRes.body.user.currentTerms.versionKey).toBe(overdueUpcoming.versionKey);
      expect(meRes.body.user.upcomingTerms).toBeNull();
      expect(meRes.body.user.acceptedCurrentTerms).toBe(false);
      expect(meRes.body.user.mustAcceptTermsNow).toBe(true);
      expect(meRes.body.user.needsUpcomingTermsAcceptance).toBe(true);
    });
  });

  describe('PATCH /auth/terms-acceptance', () => {
    it('returns 401 without auth', async () => {
      await request(app)
        .patch(`${API}/auth/terms-acceptance`)
        .send({ agreeToTerms: true })
        .expect(401);
    });

    it('returns 400 when agreeToTerms is not true', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      await agent.patch(`${API}/auth/terms-acceptance`).send({ agreeToTerms: false }).expect(400);
    });

    it('returns 200 and updates latest terms acceptance status', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const acceptRes = await agent
        .patch(`${API}/auth/terms-acceptance`)
        .send({ agreeToTerms: true })
        .expect(200);
      expect(acceptRes.body.user.hasAcceptedLatestTerms).toBe(true);
      expect(acceptRes.body.user.acceptedTermsEnforcementStartsAt).toBe(
        acceptRes.body.user.acceptedTerms.enforcementStartsAt
      );
      expect(acceptRes.body.user.mustAcceptTermsNow).toBe(false);
      expect(acceptRes.body.user.acceptedUpcomingTerms).toBe(false);
      expect(acceptRes.body.user.currentTerms.status).toBe('current');
      expect(acceptRes.body.user.acceptedTerms.status).toBe('current');
      expect(acceptRes.body.user.termsAcceptedAt).toBeTypeOf('string');
    });

    it('records acceptance for upcoming terms when upcoming exists', async () => {
      const termsVersionRepo = appDataSourceReadWrite.getRepository(TermsVersion);
      await termsVersionRepo
        .createQueryBuilder()
        .update(TermsVersion)
        .set({ status: 'deprecated' })
        .where('status = :status', { status: 'upcoming' })
        .execute();

      const now = Date.now();
      const upcoming = await termsVersionRepo.save(
        termsVersionRepo.create({
          versionKey: `upcoming-${now}`,
          title: `Upcoming Terms ${now}`,
          contentHash: `upcoming-hash-${now}`,
          content: {
            contentTextEnUs: `Upcoming terms content ${now}`,
            contentTextEs: `Contenido de términos próximo ${now}`,
          },
          announcementStartsAt: new Date(now + 60_000),
          enforcementStartsAt: new Date(now + 180_000),
          status: 'upcoming',
        })
      );

      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const acceptRes = await agent
        .patch(`${API}/auth/terms-acceptance`)
        .send({ agreeToTerms: true })
        .expect(200);

      expect(acceptRes.body.user.acceptedUpcomingTerms).toBe(true);
      expect(acceptRes.body.user.needsUpcomingTermsAcceptance).toBe(false);
      expect(acceptRes.body.user.upcomingTerms.versionKey).toBe(upcoming.versionKey);
      expect(acceptRes.body.user.acceptedTerms.versionKey).toBe(upcoming.versionKey);
    });

    it('returns upcoming acceptance requirement in auth payload before upcoming enforcement when user has accepted current only', async () => {
      const termsVersionRepo = appDataSourceReadWrite.getRepository(TermsVersion);
      await termsVersionRepo
        .createQueryBuilder()
        .update(TermsVersion)
        .set({ status: 'deprecated' })
        .where('status = :status', { status: 'upcoming' })
        .execute();

      const currentOnlyAgent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      await currentOnlyAgent
        .patch(`${API}/auth/terms-acceptance`)
        .send({ agreeToTerms: true })
        .expect(200);

      const now = Date.now();
      await termsVersionRepo.save(
        termsVersionRepo.create({
          versionKey: `upcoming-needs-accept-${now}`,
          title: `Upcoming Needs Accept ${now}`,
          contentHash: `upcoming-needs-accept-hash-${now}`,
          content: {
            contentTextEnUs: `Upcoming needs accept content ${now}`,
            contentTextEs: `Contenido de términos próximos requiere aceptación ${now}`,
          },
          announcementStartsAt: new Date(now - 60_000),
          enforcementStartsAt: new Date(now + 180_000),
          status: 'upcoming',
        })
      );

      const payloadAgent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const meRes = await payloadAgent.get(`${API}/auth/me`).expect(200);

      expect(meRes.body.user.mustAcceptTermsNow).toBe(false);
      expect(meRes.body.user.needsUpcomingTermsAcceptance).toBe(true);
      expect(meRes.body.user.acceptedUpcomingTerms).toBe(false);
      expect(meRes.body.user.upcomingTerms).not.toBeNull();
      expect(meRes.body.user.currentTerms.status).toBe('current');
      expect(['current', 'deprecated']).toContain(meRes.body.user.acceptedTerms.status);
    });

    it('keeps users blocked when they missed enforced terms and a newer upcoming enters announcement, then unblocks after accepting the newer upcoming', async () => {
      const termsVersionRepo = appDataSourceReadWrite.getRepository(TermsVersion);
      await termsVersionRepo
        .createQueryBuilder()
        .update(TermsVersion)
        .set({ status: 'deprecated' })
        .where('status IN (:...statuses)', { statuses: ['current', 'upcoming'] })
        .execute();

      const now = Date.now();
      const previouslyAccepted = await termsVersionRepo.save(
        termsVersionRepo.create({
          versionKey: `prior-accepted-${now}`,
          title: `Prior Accepted Terms ${now}`,
          contentHash: `prior-accepted-hash-${now}`,
          content: {
            contentTextEnUs: `Prior accepted terms ${now}`,
            contentTextEs: `Términos aceptados anteriores ${now}`,
          },
          announcementStartsAt: new Date(now - 600_000),
          enforcementStartsAt: new Date(now - 500_000),
          status: 'deprecated',
        })
      );

      const missedCurrent = await termsVersionRepo.save(
        termsVersionRepo.create({
          versionKey: `missed-current-${now}`,
          title: `Missed Current Terms ${now}`,
          contentHash: `missed-current-hash-${now}`,
          content: {
            contentTextEnUs: `Missed current terms ${now}`,
            contentTextEs: `Términos actuales no aceptados ${now}`,
          },
          announcementStartsAt: new Date(now - 480_000),
          enforcementStartsAt: new Date(now - 240_000),
          status: 'current',
        })
      );

      const supersedingUpcoming = await termsVersionRepo.save(
        termsVersionRepo.create({
          versionKey: `superseding-upcoming-${now}`,
          title: `Superseding Upcoming Terms ${now}`,
          contentHash: `superseding-upcoming-hash-${now}`,
          content: {
            contentTextEnUs: `Superseding upcoming terms ${now}`,
            contentTextEs: `Términos próximos que reemplazan ${now}`,
          },
          announcementStartsAt: new Date(now - 120_000),
          enforcementStartsAt: new Date(now + 240_000),
          status: 'upcoming',
        })
      );

      const blockedUserEmail = `${FILE_PREFIX}-compliance-debt-${Date.now()}@example.com`;
      const blockedUserPassword = `${FILE_PREFIX}-compliance-debt-password`;
      const blockedUser = await UserService.create({
        email: blockedUserEmail,
        password: await hashPassword(blockedUserPassword),
        displayName: 'Compliance Debt User',
      });
      await UserTermsAcceptanceService.recordAcceptanceForVersion(
        blockedUser.id,
        previouslyAccepted.id,
        {
          acceptanceSource: 'test-seed',
        }
      );

      const agent = await createApiLoginAgent(app, {
        email: blockedUserEmail,
        password: blockedUserPassword,
      });
      const meBeforeAcceptance = await agent.get(`${API}/auth/me`).expect(200);
      expect(meBeforeAcceptance.body.user.currentTerms.versionKey).toBe(missedCurrent.versionKey);
      expect(meBeforeAcceptance.body.user.upcomingTerms.versionKey).toBe(
        supersedingUpcoming.versionKey
      );
      expect(meBeforeAcceptance.body.user.termsPolicyPhase).toBe('announcement');
      expect(meBeforeAcceptance.body.user.mustAcceptTermsNow).toBe(true);
      expect(meBeforeAcceptance.body.user.needsUpcomingTermsAcceptance).toBe(true);

      const acceptRes = await agent
        .patch(`${API}/auth/terms-acceptance`)
        .send({ agreeToTerms: true })
        .expect(200);
      expect(acceptRes.body.user.acceptedUpcomingTerms).toBe(true);
      expect(acceptRes.body.user.mustAcceptTermsNow).toBe(false);
      expect(acceptRes.body.user.needsUpcomingTermsAcceptance).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns 401 without refresh cookie', async () => {
      await request(app).post(`${API}/auth/refresh`).expect(401);
    });

    it('returns 401 with invalid refresh token', async () => {
      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .set('Cookie', `${refreshCookieName}=invalid-token`)
        .expect(401);
      expect(res.body.message).toBe('Invalid or expired session');
    });

    it('returns 200 with user and new cookies when refresh cookie valid', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const res = await agent.post(`${API}/auth/refresh`).expect(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUserEmail);
      expect(typeof res.body.user.hasAcceptedLatestTerms).toBe('boolean');
      const setCookie = res.headers['set-cookie'];
      const cookies = Array.isArray(setCookie)
        ? setCookie
        : setCookie !== undefined
          ? [setCookie]
          : [];
      expect(cookies.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /auth/change-password', () => {
    it('returns 401 without auth', async () => {
      await request(app)
        .post(`${API}/auth/change-password`)
        .send({ currentPassword: 'x', newPassword: 'y' })
        .expect(401);
    });

    it('returns 400 when currentPassword or newPassword missing', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      await agent.post(`${API}/auth/change-password`).send({ newPassword: 'new1' }).expect(400);
      await agent.post(`${API}/auth/change-password`).send({ currentPassword: 'old' }).expect(400);
    });

    it('returns 400 when newPassword fails validation (too short)', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      const res = await agent
        .post(`${API}/auth/change-password`)
        .send({ currentPassword: testUserPassword, newPassword: 'x' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    it('returns 401 when current password wrong', async () => {
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      await agent
        .post(`${API}/auth/change-password`)
        .send({ currentPassword: 'wrong', newPassword: 'new-pass' })
        .expect(401, { message: 'Current password is incorrect' });
    });

    it('returns 204 and allows login with new password', async () => {
      const newPassword = 'new-password-2';
      const agent = await createApiLoginAgent(app, {
        email: testUserEmail,
        password: testUserPassword,
      });
      await agent
        .post(`${API}/auth/change-password`)
        .send({ currentPassword: testUserPassword, newPassword })
        .expect(204);
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: testUserEmail, password: newPassword })
        .expect(200);
    });
  });

  describe('DELETE /auth/me', () => {
    it('returns 401 without auth', async () => {
      await request(app).delete(`${API}/auth/me`).expect(401);
    });

    it('returns 204 and prevents future login for deleted account', async () => {
      const deleteEmail = `${FILE_PREFIX}-delete-${Date.now()}@example.com`;
      const deletePassword = `${FILE_PREFIX}-delete-password`;
      await UserService.create({
        email: deleteEmail,
        password: await hashPassword(deletePassword),
        displayName: 'Delete User',
      });
      const agent = await createApiLoginAgent(app, {
        email: deleteEmail,
        password: deletePassword,
      });
      await agent.delete(`${API}/auth/me`).expect(204);
      await request(app)
        .post(`${API}/auth/login`)
        .send({ email: deleteEmail, password: deletePassword })
        .expect(401, { message: AUTH_MESSAGE_INVALID_CREDENTIALS });
    });
  });
});
