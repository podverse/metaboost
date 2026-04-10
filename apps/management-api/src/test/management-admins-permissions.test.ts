import type request from 'supertest';

/**
 * Management API – admins CRUD permission-based integration tests.
 * Tests that admins with limited permissions are properly gated by requireCrud / requireSuperAdmin.
 * Super admin fixtures are shared; limited-permission admin fixtures are created per describe block.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../config/index.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'mgmt-ap';
const superAdminUsername = `${FILE_PREFIX}-super-admin`;
const superAdminPassword = `${FILE_PREFIX}-super-admin-password-1`;

describe('management-api admins permissions', () => {
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

  describe('admin with read-only permissions on admins', () => {
    const ts = Date.now();
    const readOnlyEmail = `${FILE_PREFIX}-read-admin-${ts}@example.com`;
    const readOnlyPassword = `${FILE_PREFIX}-read-password-1`;
    let readOnlyAdminId: string;
    let readOnlyAgent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
      const res = await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: readOnlyEmail,
          password: readOnlyPassword,
          displayName: `Read Only Admin ${ts}`,
          adminsCrud: 2, // read only (CrudMask: create=1, read=2, update=4, delete=8)
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      readOnlyAdminId = res.body.admin.id;

      readOnlyAgent = await createManagementLoginAgent(app, {
        username: readOnlyEmail,
        password: readOnlyPassword,
      });
    });

    it('GET /admins returns 200 (has read)', async () => {
      const res = await readOnlyAgent.get(`${API}/admins`).expect(200);
      expect(Array.isArray(res.body.admins)).toBe(true);
    });

    it('GET /admins/:id returns 200 (has read)', async () => {
      const res = await readOnlyAgent.get(`${API}/admins/${readOnlyAdminId}`).expect(200);
      expect(res.body.admin.id).toBe(readOnlyAdminId);
    });

    it('POST /admins returns 403 (not super admin)', async () => {
      await readOnlyAgent
        .post(`${API}/admins`)
        .send({
          username: `${FILE_PREFIX}-new-by-readonly-${ts}@example.com`,
          password: 'password-1',
          displayName: `New By Readonly ${ts}`,
          adminsCrud: 0,
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(403);
    });

    it('PATCH /admins/:id returns 403 (no update permission)', async () => {
      await readOnlyAgent
        .patch(`${API}/admins/${readOnlyAdminId}`)
        .send({ displayName: `Updated By Readonly ${ts}` })
        .expect(403);
    });

    it('DELETE /admins/:id returns 403 (no delete permission)', async () => {
      await readOnlyAgent.delete(`${API}/admins/${readOnlyAdminId}`).expect(403);
    });

    it('PATCH /admins/:id permission update succeeds when actor has update permission', async () => {
      // Admin with update permission can update another admin's permissions (non–super-admin target)
      const updateEmail = `${FILE_PREFIX}-update-perm-${ts}@example.com`;
      const createRes = await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: updateEmail,
          password: 'update-password-1',
          displayName: `Update Perm Admin ${ts}`,
          adminsCrud: 4, // update only
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      const updateAdminId = createRes.body.admin.id;
      const updateAgent = await createManagementLoginAgent(app, {
        username: updateEmail,
        password: 'update-password-1',
      });
      const patchRes = await updateAgent
        .patch(`${API}/admins/${readOnlyAdminId}`)
        .send({ adminsCrud: 15 })
        .expect(200);
      expect(patchRes.body.admin.permissions?.adminsCrud).toBe(15);
      // Cleanup
      await superAdminAgent.delete(`${API}/admins/${updateAdminId}`).expect(204);
    });

    afterAll(async () => {
      if (readOnlyAdminId !== undefined) {
        await superAdminAgent.delete(`${API}/admins/${readOnlyAdminId}`).expect(204);
      }
    });
  });

  describe('admin with no permissions on admins', () => {
    const ts2 = Date.now() + 1;
    const noPermEmail = `${FILE_PREFIX}-no-perm-${ts2}@example.com`;
    const noPermPassword = 'no-perm-password-1';
    let noPermAdminId: string;
    let noPermAgent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
      const res = await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: noPermEmail,
          password: noPermPassword,
          displayName: `No Perm Admin ${ts2}`,
          adminsCrud: 0,
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      noPermAdminId = res.body.admin.id;

      noPermAgent = await createManagementLoginAgent(app, {
        username: noPermEmail,
        password: noPermPassword,
      });
    });

    it('GET /admins returns 403 (no read permission)', async () => {
      await noPermAgent.get(`${API}/admins`).expect(403);
    });

    it('GET /admins/:id returns 403 (no read permission)', async () => {
      await noPermAgent.get(`${API}/admins/${noPermAdminId}`).expect(403);
    });

    afterAll(async () => {
      if (noPermAdminId !== undefined) {
        await superAdminAgent.delete(`${API}/admins/${noPermAdminId}`).expect(204);
      }
    });
  });

  describe('super admin retrieval', () => {
    it('returns 200 when looking up super admin by id', async () => {
      const meRes = await superAdminAgent.get(`${API}/auth/me`).expect(200);
      const superAdminId = meRes.body.user.id;
      const res = await superAdminAgent.get(`${API}/admins/${superAdminId}`).expect(200);
      expect(res.body.admin.id).toBe(superAdminId);
    });
  });

  describe('display name uniqueness', () => {
    const ts3 = Date.now() + 2;
    let adminIdA: string;

    beforeAll(async () => {
      const res = await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: `${FILE_PREFIX}-dn-a-${ts3}@example.com`,
          password: 'dn-a-password',
          displayName: `Unique DN Admin ${ts3}`,
          adminsCrud: 0,
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      adminIdA = res.body.admin.id;
    });

    it('POST /admins returns 409 when display name already in use', async () => {
      await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: `${FILE_PREFIX}-dn-b-${ts3}@example.com`,
          password: 'dn-b-password',
          displayName: `Unique DN Admin ${ts3}`,
          adminsCrud: 0,
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(409, { message: 'Display name already in use' });
    });

    it('PATCH /admins/:id returns 409 when display name already in use', async () => {
      // Get super admin's display name
      const meRes = await superAdminAgent.get(`${API}/auth/me`).expect(200);
      const superAdminDisplayName = meRes.body.user.displayName;
      if (superAdminDisplayName !== null) {
        await superAdminAgent
          .patch(`${API}/admins/${adminIdA}`)
          .send({ displayName: superAdminDisplayName })
          .expect(409, { message: 'Display name already in use' });
      }
    });

    afterAll(async () => {
      await superAdminAgent.delete(`${API}/admins/${adminIdA}`).expect(204);
    });
  });

  describe('DELETE /admins/:id returns 404 for nonexistent id', () => {
    it('returns 404', async () => {
      await superAdminAgent
        .delete(`${API}/admins/00000000-0000-0000-0000-000000000000`)
        .expect(404);
    });
  });
});
