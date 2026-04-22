/**
 * Management API integration tests: PATCH /auth/me (updateProfile).
 * Covers display name update, validation errors, and auth requirement.
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../config/index.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'mgmt-aup';
const superAdminUsername = `${FILE_PREFIX}-sa`;
const superAdminPassword = `${FILE_PREFIX}-sa-password-1`;

describe('management-api PATCH /auth/me (updateProfile)', () => {
  let app: Awaited<ReturnType<typeof createManagementApiTestAppWithSuperAdmin>>;
  let superAdminAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await createManagementApiTestAppWithSuperAdmin(superAdminUsername, superAdminPassword);
    superAdminAgent = await createManagementLoginAgent(app, {
      username: superAdminUsername,
      password: superAdminPassword,
    });
  });

  afterAll(async () => {
    await destroyManagementApiTestDataSources();
  });

  it('returns 401 without auth', async () => {
    await request(app).patch(`${API}/auth/me`).send({ displayName: 'No Auth' }).expect(401);
  });

  it('returns 200 with updated displayName when valid body sent', async () => {
    const newDisplayName = `Updated ${Date.now()}`;
    const res = await superAdminAgent
      .patch(`${API}/auth/me`)
      .send({ displayName: newDisplayName })
      .expect(200);
    expect(res.body.user.displayName).toBe(newDisplayName);
  });

  it('returns 400 when body is empty', async () => {
    await superAdminAgent.patch(`${API}/auth/me`).send({}).expect(400);
  });

  it('returns 400 when displayName is missing', async () => {
    await superAdminAgent.patch(`${API}/auth/me`).send({ username: 'irrelevant' }).expect(400);
  });

  it('returns 400 when displayName exceeds max length', async () => {
    await superAdminAgent
      .patch(`${API}/auth/me`)
      .send({ displayName: 'x'.repeat(51) })
      .expect(400);
  });

  it('returns 400 when displayName is empty string', async () => {
    await superAdminAgent.patch(`${API}/auth/me`).send({ displayName: '' }).expect(400);
  });

  it('subsequent GET /auth/me reflects the updated displayName', async () => {
    const persistedName = `Persisted ${Date.now()}`;
    await superAdminAgent.patch(`${API}/auth/me`).send({ displayName: persistedName }).expect(200);
    const meRes = await superAdminAgent.get(`${API}/auth/me`).expect(200);
    expect(meRes.body.user.displayName).toBe(persistedName);
  });
});
