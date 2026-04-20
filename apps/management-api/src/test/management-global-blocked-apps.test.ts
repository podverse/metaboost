import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../config/index.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'mgmt-global-blocked-apps';
const superAdminUsername = `${FILE_PREFIX}-super-admin`;
const superAdminPassword = `${FILE_PREFIX}-super-admin-password-1`;

describe('management-api global blocked apps permissions', () => {
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

  it('GET /apps returns 401 without auth', async () => {
    await request(app).get(`${API}/apps`).expect(401);
  });

  it('super-admin can list, create, and delete global blocked apps', async () => {
    const appId = `e2e-${Date.now()}`;

    const listBefore = await superAdminAgent.get(`${API}/apps`).expect(200);
    expect(Array.isArray(listBefore.body.apps)).toBe(true);

    const created = await superAdminAgent
      .post(`${API}/apps/global-blocked`)
      .send({ appId, note: 'integration test' })
      .expect(201);
    expect(created.body.blockedApp.appId).toBe(appId);

    await superAdminAgent.delete(`${API}/apps/global-blocked/${appId}`).expect(204);
  });

  it('admin with admins read only cannot create or delete global blocked apps', async () => {
    const ts = Date.now();
    const readOnlyUsername = `${FILE_PREFIX}-read-only-${ts}@example.com`;
    const readOnlyPassword = `${FILE_PREFIX}-read-only-password`;
    const readOnlyCreate = await superAdminAgent
      .post(`${API}/admins`)
      .send({
        username: readOnlyUsername,
        password: readOnlyPassword,
        displayName: `Read Only ${ts}`,
        adminsCrud: 2,
        usersCrud: 0,
        eventVisibility: 'all_admins',
      })
      .expect(201);
    const readOnlyAdminId = readOnlyCreate.body.admin.id as string;
    const readOnlyAgent = await createManagementLoginAgent(app, {
      username: readOnlyUsername,
      password: readOnlyPassword,
    });
    const appId = `e2e-ro-${ts}`;
    await readOnlyAgent.post(`${API}/apps/global-blocked`).send({ appId }).expect(403);
    await readOnlyAgent.delete(`${API}/apps/global-blocked/${appId}`).expect(403);
    await superAdminAgent.delete(`${API}/admins/${readOnlyAdminId}`).expect(204);
  });
});
