import request from 'supertest';
/**
 * API integration tests: responses must never contain passwordHash/credentials, and
 * other-user summaries must exclude email while allowing username/displayName.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BucketAdminService, BucketService, UserService } from '@boilerplate/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'pii-responses';

function assertNoCredentialsInObject(obj: unknown): void {
  if (obj === null || typeof obj !== 'object') return;
  const o = obj as Record<string, unknown>;
  expect(o).not.toHaveProperty('passwordHash');
  expect(o).not.toHaveProperty('credentials');
  for (const value of Object.values(o)) {
    assertNoCredentialsInObject(value);
  }
}

describe('PII and credentials in API responses', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-owner-pw`;
  const otherEmail = `${FILE_PREFIX}-other-${Date.now()}@example.com`;
  const otherPassword = `${FILE_PREFIX}-other-pw`;
  let bucketShortId: string;

  beforeAll(async () => {
    app = await createApiTestApp();
    const ownerHash = await hashPassword(ownerPassword);
    const otherHash = await hashPassword(otherPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: ownerHash,
      displayName: 'Owner',
    });
    const other = await UserService.create({
      email: otherEmail,
      password: otherHash,
      displayName: 'Other Admin',
    });
    const bucket = await BucketService.create({
      ownerId: owner.id,
      name: 'PII Test Bucket',
    });
    bucketShortId = bucket.shortId;
    await BucketAdminService.create({
      bucketId: bucket.id,
      userId: other.id,
      bucketCrud: 1,
      bucketMessagesCrud: 0,
      bucketAdminsCrud: 1,
    });
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
  });

  it('login response body does not contain passwordHash or credentials', async () => {
    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: ownerEmail, password: ownerPassword })
      .expect(200);
    assertNoCredentialsInObject(res.body);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('email');
    expect(res.body.user.email).toBe(ownerEmail);
  });

  it('bucket admins list response does not contain passwordHash or credentials', async () => {
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const res = await agent.get(`${API}/buckets/${bucketShortId}/admins`).expect(200);
    assertNoCredentialsInObject(res.body);
  });

  it('bucket admins list returns other users as PublicUserSummary (no email, includes username)', async () => {
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const res = await agent.get(`${API}/buckets/${bucketShortId}/admins`).expect(200);
    expect(res.body).toHaveProperty('admins');
    const admins = res.body.admins as Array<{ user: Record<string, unknown> | null }>;
    expect(admins.length).toBeGreaterThanOrEqual(1);
    for (const admin of admins) {
      if (admin.user !== null && typeof admin.user === 'object') {
        expect(admin.user).toHaveProperty('id');
        expect(admin.user).toHaveProperty('shortId');
        expect(admin.user).toHaveProperty('username');
        expect(admin.user).toHaveProperty('displayName');
        expect(admin.user).not.toHaveProperty('email');
      }
    }
  });
});
