import type request from 'supertest';

/**
 * Management API – users CRUD permission-based integration tests.
 * Tests that admins with limited permissions are properly gated by requireCrud.
 * Also covers POST /users/:id/change-password permission checks.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { UserService } from '@boilerplate/orm';

import { config } from '../config/index.js';
import { hashPassword } from '../lib/auth/hash.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'mgmt-up';
const superAdminUsername = `${FILE_PREFIX}-super-admin`;
const superAdminPassword = `${FILE_PREFIX}-super-admin-password-1`;

async function createUserFixture(email: string, displayName: string): Promise<string> {
  const passwordHash = await hashPassword('target-user-password-1');
  const user = await UserService.create({
    email,
    password: passwordHash,
    displayName,
  });
  return user.id;
}

describe('management-api users permissions', () => {
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

  describe('admin with read-only permissions on users', () => {
    const ts = Date.now();
    const readOnlyEmail = `${FILE_PREFIX}-read-admin-${ts}@example.com`;
    const readOnlyPassword = `${FILE_PREFIX}-read-password-1`;
    let readOnlyAdminId: string;
    let readOnlyAgent: ReturnType<typeof request.agent>;
    let targetUserId: string;

    beforeAll(async () => {
      // Create admin with read-only user permissions
      const adminRes = await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: readOnlyEmail,
          password: readOnlyPassword,
          displayName: `Users Read Admin ${ts}`,
          adminsCrud: 0,
          usersCrud: 2, // read only (CrudMask: create=1, read=2, update=4, delete=8)
          eventVisibility: 'all_admins',
        })
        .expect(201);
      readOnlyAdminId = adminRes.body.admin.id;

      readOnlyAgent = await createManagementLoginAgent(app, {
        username: readOnlyEmail,
        password: readOnlyPassword,
      });

      // Create a target user to act on (direct fixture; POST /users contract is covered elsewhere)
      targetUserId = await createUserFixture(
        `${FILE_PREFIX}-target-read-${ts}@example.com`,
        `Target User Read ${ts}`
      );
    });

    it('GET /users returns 200 (has read)', async () => {
      const res = await readOnlyAgent.get(`${API}/users`).expect(200);
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('GET /users/:id returns 200 (has read)', async () => {
      const res = await readOnlyAgent.get(`${API}/users/${targetUserId}`).expect(200);
      expect(res.body.user.id).toBe(targetUserId);
    });

    it('POST /users returns 403 (no create permission)', async () => {
      await readOnlyAgent
        .post(`${API}/users`)
        .send({
          email: `${FILE_PREFIX}-denied-create-${ts}@example.com`,
          password: 'password-1',
        })
        .expect(403);
    });

    it('PATCH /users/:id returns 403 (no update permission)', async () => {
      await readOnlyAgent
        .patch(`${API}/users/${targetUserId}`)
        .send({ displayName: 'Unauthorized Update' })
        .expect(403);
    });

    it('DELETE /users/:id returns 403 (no delete permission)', async () => {
      await readOnlyAgent.delete(`${API}/users/${targetUserId}`).expect(403);
    });

    it('POST /users/:id/change-password returns 403 (no users update permission)', async () => {
      await readOnlyAgent
        .post(`${API}/users/${targetUserId}/change-password`)
        .send({ newPassword: 'new-password-1' })
        .expect(403, { message: 'Insufficient permissions to change user password' });
    });

    afterAll(async () => {
      if (targetUserId !== undefined) {
        await superAdminAgent.delete(`${API}/users/${targetUserId}`).expect(204);
      }
      if (readOnlyAdminId !== undefined) {
        await superAdminAgent.delete(`${API}/admins/${readOnlyAdminId}`).expect(204);
      }
    });
  });

  describe('admin with no permissions on users', () => {
    const ts2 = Date.now() + 1;
    const noPermEmail = `${FILE_PREFIX}-no-perm-${ts2}@example.com`;
    const noPermPassword = 'users-no-perm-password-1';
    let noPermAdminId: string;
    let noPermAgent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
      const res = await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: noPermEmail,
          password: noPermPassword,
          displayName: `Users No Perm Admin ${ts2}`,
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

    it('GET /users returns 403 (no read permission)', async () => {
      await noPermAgent.get(`${API}/users`).expect(403);
    });

    it('GET /users/:id returns 403 (no read permission)', async () => {
      await noPermAgent.get(`${API}/users/00000000-0000-0000-0000-000000000000`).expect(403);
    });

    afterAll(async () => {
      if (noPermAdminId !== undefined) {
        await superAdminAgent.delete(`${API}/admins/${noPermAdminId}`).expect(204);
      }
    });
  });

  describe('admin with users update permission (implies change-password)', () => {
    const ts3 = Date.now() + 2;
    const changePassEmail = `${FILE_PREFIX}-changepw-admin-${ts3}@example.com`;
    const changePassPassword = 'changepw-admin-password-1';
    let changePassAdminId: string;
    let changePassAgent: ReturnType<typeof request.agent>;
    let targetUserId: string;

    beforeAll(async () => {
      const adminRes = await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: changePassEmail,
          password: changePassPassword,
          displayName: `Change PW Admin ${ts3}`,
          adminsCrud: 0,
          usersCrud: 6, // read=2 + update=4 (update implies change-password)
          eventVisibility: 'all_admins',
        })
        .expect(201);
      changePassAdminId = adminRes.body.admin.id;

      changePassAgent = await createManagementLoginAgent(app, {
        username: changePassEmail,
        password: changePassPassword,
      });

      targetUserId = await createUserFixture(
        `${FILE_PREFIX}-target-changepw-${ts3}@example.com`,
        `Target User ChangePW ${ts3}`
      );
    });

    it('POST /users/:id/change-password returns 204 (has users update permission)', async () => {
      await changePassAgent
        .post(`${API}/users/${targetUserId}/change-password`)
        .send({ newPassword: 'new-valid-password-1' })
        .expect(204);
    });

    it('POST /users/:id/change-password returns 400 when newPassword fails validation', async () => {
      const res = await changePassAgent
        .post(`${API}/users/${targetUserId}/change-password`)
        .send({ newPassword: 'x' })
        .expect(400);
      expect(res.body.message).toBeDefined();
    });

    afterAll(async () => {
      if (targetUserId !== undefined) {
        await superAdminAgent.delete(`${API}/users/${targetUserId}`).expect(204);
      }
      if (changePassAdminId !== undefined) {
        await superAdminAgent.delete(`${API}/admins/${changePassAdminId}`).expect(204);
      }
    });
  });
});
