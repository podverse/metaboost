import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../config/index.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import { retryTransientNetwork } from './helpers/retry-transient-network.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'mgmt-bucket-blocked-apps';
const superAdminUsername = `${FILE_PREFIX}-super-admin`;
const superAdminPassword = `${FILE_PREFIX}-super-admin-password-1`;

describe('management-api bucket-scoped blocked apps', () => {
  let app: Awaited<ReturnType<typeof createManagementApiTestAppWithSuperAdmin>>;
  let superAdminAgent: ReturnType<typeof request.agent>;
  let ownerUserId: string;
  let rootBucketId: string;

  beforeAll(async () => {
    app = await createManagementApiTestAppWithSuperAdmin(superAdminUsername, superAdminPassword);
    superAdminAgent = await retryTransientNetwork('create super admin login agent', async () =>
      createManagementLoginAgent(app, {
        username: superAdminUsername,
        password: superAdminPassword,
      })
    );

    const userRes = await superAdminAgent
      .post(`${API}/users`)
      .send({
        email: `${FILE_PREFIX}-owner@example.com`,
        password: `${FILE_PREFIX}-owner-password-1`,
        displayName: 'Bucket Blocked Apps Owner',
      })
      .expect(201);
    ownerUserId = userRes.body.user.id as string;

    const createRes = await superAdminAgent
      .post(`${API}/buckets`)
      .send({
        name: 'Blocked Apps Test Root',
        ownerId: ownerUserId,
        isPublic: true,
      })
      .expect(201);
    rootBucketId = createRes.body.bucket.id as string;
  });

  afterAll(async () => {
    await destroyManagementApiTestDataSources();
  });

  it('GET /buckets/:id/registry-apps returns 401 without auth', async () => {
    await request(app).get(`${API}/buckets/${rootBucketId}/registry-apps`).expect(401);
  });

  it('super-admin can get registry-app policy, add and remove a bucket block', async () => {
    const policyRes = await superAdminAgent
      .get(`${API}/buckets/${rootBucketId}/registry-apps`)
      .expect(200);
    expect(Array.isArray(policyRes.body.apps)).toBe(true);

    const appId = `e2e-bkt-block-${Date.now()}`;
    const postRes = await superAdminAgent
      .post(`${API}/buckets/${rootBucketId}/blocked-apps`)
      .send({ appId, appNameSnapshot: 'E2E Block' })
      .expect(201);
    const rowId = postRes.body.blockedApp.id as string;
    expect(postRes.body.blockedApp.appId).toBe(appId);

    const listRes = await superAdminAgent
      .get(`${API}/buckets/${rootBucketId}/blocked-apps`)
      .expect(200);
    const rows = listRes.body.blockedApps as { id: string; appId: string }[];
    expect(rows.some((r) => r.id === rowId && r.appId === appId)).toBe(true);

    await superAdminAgent
      .delete(`${API}/buckets/${rootBucketId}/blocked-apps/${rowId}`)
      .expect(204);
  });
});
