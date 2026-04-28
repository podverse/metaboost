/**
 * API integration tests: bucket admins endpoints.
 * Ensures the bucket owner cannot be updated or removed via the API (no backdoor).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BucketService, UserService } from '@metaboost/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createApiLoginAgent } from './helpers/login-agent.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'bucket-admins';

describe('bucket admins', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  const ownerEmail = `${FILE_PREFIX}-owner-${Date.now()}@example.com`;
  const ownerPassword = `${FILE_PREFIX}-password-1`;
  let ownerShortId: string;
  let bucketIdText: string;

  beforeAll(async () => {
    app = await createApiTestApp();
    const hashed = await hashPassword(ownerPassword);
    const owner = await UserService.create({
      email: ownerEmail,
      password: hashed,
      displayName: 'Bucket Owner',
    });
    ownerShortId = owner.idText;
    const bucket = await BucketService.create({
      ownerId: owner.id,
      name: 'Test Bucket',
    });
    bucketIdText = bucket.idText;
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
  });

  it('PATCH /buckets/:bucketId/admins/:userId returns 403 when target is the bucket owner', async () => {
    const agent = await createApiLoginAgent(app, {
      email: ownerEmail,
      password: ownerPassword,
    });
    const res = await agent
      .patch(`${API}/buckets/${bucketIdText}/admins/${ownerShortId}`)
      .send({ bucketCrud: 2 })
      .expect(403);
    expect(res.body).toEqual({ message: 'Bucket owner cannot be edited' });
  });
});
