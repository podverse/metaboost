/**
 * Management API integration tests: admin roles CRUD endpoints.
 * Covers list (predefined + custom), create, update, delete,
 * validation errors, and permission gating.
 */
import type request from 'supertest';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../config/index.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
/** Unique per file to avoid collisions when tests run in parallel. */
const FILE_PREFIX = 'mgmt-ar';
const superAdminUsername = `${FILE_PREFIX}-sa`;
const superAdminPassword = `${FILE_PREFIX}-sa-password-1`;

const validRoleBody = {
  adminsCrud: 0,
  usersCrud: 0,
  bucketsCrud: 0,
  bucketMessagesCrud: 0,
  bucketAdminsCrud: 0,
  eventVisibility: 'all_admins' as const,
};

describe('management-api admin roles', () => {
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

  describe('GET /admins/roles', () => {
    it('returns 401 without auth', async () => {
      await (await import('supertest')).default(app).get(`${API}/admins/roles`).expect(401);
    });

    it('returns 200 with roles array including predefined roles', async () => {
      const res = await superAdminAgent.get(`${API}/admins/roles`).expect(200);
      expect(Array.isArray(res.body.roles)).toBe(true);
      const predefined = res.body.roles.filter(
        (r: { isPredefined: boolean }) => r.isPredefined === true
      );
      expect(predefined.length).toBeGreaterThanOrEqual(3);
      const ids = predefined.map((r: { id: string }) => r.id);
      expect(ids).toContain('everything');
      expect(ids).toContain('read_everything');
      expect(ids).toContain('users_full');
      for (const role of predefined) {
        expect(role).toHaveProperty('id');
        expect(role).toHaveProperty('nameKey');
        expect(role).toHaveProperty('adminsCrud');
        expect(role).toHaveProperty('usersCrud');
        expect(role).toHaveProperty('bucketsCrud');
        expect(role).toHaveProperty('bucketMessagesCrud');
        expect(role).toHaveProperty('bucketAdminsCrud');
        expect(role).toHaveProperty('eventVisibility');
        expect(role).toHaveProperty('isPredefined', true);
        expect(role.createdAt).toBeNull();
      }
    });

    it('returns 403 for admin without admins:read permission', async () => {
      const ts = Date.now();
      const noReadUsername = `${FILE_PREFIX}-noread-${ts}@example.com`;
      const noReadPassword = `${FILE_PREFIX}-noread-pw`;
      await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: noReadUsername,
          password: noReadPassword,
          displayName: `No Read ${ts}`,
          adminsCrud: 0,
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      const noReadAgent = await createManagementLoginAgent(app, {
        username: noReadUsername,
        password: noReadPassword,
      });
      await noReadAgent.get(`${API}/admins/roles`).expect(403);
    });
  });

  describe('POST /admins/roles', () => {
    it('returns 400 when name is missing', async () => {
      await superAdminAgent
        .post(`${API}/admins/roles`)
        .send({ ...validRoleBody, name: undefined })
        .expect(400);
    });

    it('returns 400 when adminsCrud is outside 0-15', async () => {
      await superAdminAgent
        .post(`${API}/admins/roles`)
        .send({ ...validRoleBody, name: 'Bad Crud', adminsCrud: -1 })
        .expect(400);
      await superAdminAgent
        .post(`${API}/admins/roles`)
        .send({ ...validRoleBody, name: 'Bad Crud', adminsCrud: 16 })
        .expect(400);
    });

    it('returns 400 when eventVisibility is invalid', async () => {
      await superAdminAgent
        .post(`${API}/admins/roles`)
        .send({ ...validRoleBody, name: 'Bad Vis', eventVisibility: 'nobody' })
        .expect(400);
    });

    it('returns 400 when required crud fields are missing', async () => {
      await superAdminAgent
        .post(`${API}/admins/roles`)
        .send({ name: 'Missing Fields' })
        .expect(400);
    });

    it('returns 201 with created role when body valid', async () => {
      const roleName = `${FILE_PREFIX}-custom-${Date.now()}`;
      const res = await superAdminAgent
        .post(`${API}/admins/roles`)
        .send({ ...validRoleBody, name: roleName, usersCrud: 3, adminsCrud: 2 })
        .expect(201);
      expect(res.body.role).toBeDefined();
      expect(res.body.role.name).toBe(roleName);
      expect(res.body.role.adminsCrud).toBe(2);
      expect(res.body.role.usersCrud).toBe(3);
      expect(res.body.role.bucketsCrud).toBe(0);
      expect(res.body.role.bucketMessagesCrud).toBe(0);
      expect(res.body.role.bucketAdminsCrud).toBe(0);
      expect(res.body.role.eventVisibility).toBe('all_admins');
      expect(res.body.role.isPredefined).toBe(false);
      expect(res.body.role).toHaveProperty('id');
      expect(res.body.role.createdAt).toBeTypeOf('string');
    });

    it('returns 403 for admin without admins:create permission', async () => {
      const ts = Date.now();
      const readOnlyUsername = `${FILE_PREFIX}-readonly-${ts}@example.com`;
      const readOnlyPassword = `${FILE_PREFIX}-readonly-pw`;
      await superAdminAgent
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
      const readOnlyAgent = await createManagementLoginAgent(app, {
        username: readOnlyUsername,
        password: readOnlyPassword,
      });
      await readOnlyAgent
        .post(`${API}/admins/roles`)
        .send({ ...validRoleBody, name: 'Blocked Create' })
        .expect(403);
    });
  });

  describe('PATCH /admins/roles/:roleId', () => {
    it('returns 404 for nonexistent roleId', async () => {
      await superAdminAgent
        .patch(`${API}/admins/roles/00000000-0000-0000-0000-000000000000`)
        .send({ name: 'Nope' })
        .expect(404, { message: 'Role not found' });
    });

    it('returns 200 with updated role when body valid', async () => {
      const roleName = `${FILE_PREFIX}-to-update-${Date.now()}`;
      const created = await superAdminAgent
        .post(`${API}/admins/roles`)
        .send({ ...validRoleBody, name: roleName })
        .expect(201);
      const roleId = created.body.role.id;
      const updatedName = `${FILE_PREFIX}-updated-${Date.now()}`;
      const res = await superAdminAgent
        .patch(`${API}/admins/roles/${roleId}`)
        .send({ name: updatedName, usersCrud: 15 })
        .expect(200);
      expect(res.body.role.name).toBe(updatedName);
      expect(res.body.role.usersCrud).toBe(15);
    });

    it('returns 403 for admin without admins:update permission', async () => {
      const ts = Date.now();
      const readOnlyUsername = `${FILE_PREFIX}-noupdate-${ts}@example.com`;
      const readOnlyPassword = `${FILE_PREFIX}-noupdate-pw`;
      await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: readOnlyUsername,
          password: readOnlyPassword,
          displayName: `No Update ${ts}`,
          adminsCrud: 2,
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      const readOnlyAgent = await createManagementLoginAgent(app, {
        username: readOnlyUsername,
        password: readOnlyPassword,
      });
      await readOnlyAgent
        .patch(`${API}/admins/roles/00000000-0000-0000-0000-000000000000`)
        .send({ name: 'Blocked' })
        .expect(403);
    });
  });

  describe('DELETE /admins/roles/:roleId', () => {
    it('returns 404 for nonexistent roleId', async () => {
      await superAdminAgent
        .delete(`${API}/admins/roles/00000000-0000-0000-0000-000000000000`)
        .expect(404, { message: 'Role not found' });
    });

    it('returns 204 when role exists and is deleted', async () => {
      const roleName = `${FILE_PREFIX}-to-delete-${Date.now()}`;
      const created = await superAdminAgent
        .post(`${API}/admins/roles`)
        .send({ ...validRoleBody, name: roleName })
        .expect(201);
      const roleId = created.body.role.id;
      await superAdminAgent.delete(`${API}/admins/roles/${roleId}`).expect(204);
    });

    it('role no longer appears in list after delete', async () => {
      const roleName = `${FILE_PREFIX}-vanish-${Date.now()}`;
      const created = await superAdminAgent
        .post(`${API}/admins/roles`)
        .send({ ...validRoleBody, name: roleName })
        .expect(201);
      const roleId = created.body.role.id;
      await superAdminAgent.delete(`${API}/admins/roles/${roleId}`).expect(204);
      const listRes = await superAdminAgent.get(`${API}/admins/roles`).expect(200);
      const customRoles = listRes.body.roles.filter(
        (r: { isPredefined: boolean }) => r.isPredefined === false
      );
      const found = customRoles.find((r: { id: string }) => r.id === roleId);
      expect(found).toBeUndefined();
    });

    it('returns 403 for admin without admins:delete permission', async () => {
      const ts = Date.now();
      const noDeleteUsername = `${FILE_PREFIX}-nodelete-${ts}@example.com`;
      const noDeletePassword = `${FILE_PREFIX}-nodelete-pw`;
      await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: noDeleteUsername,
          password: noDeletePassword,
          displayName: `No Delete ${ts}`,
          adminsCrud: 2,
          usersCrud: 0,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      const noDeleteAgent = await createManagementLoginAgent(app, {
        username: noDeleteUsername,
        password: noDeletePassword,
      });
      await noDeleteAgent
        .delete(`${API}/admins/roles/00000000-0000-0000-0000-000000000000`)
        .expect(403);
    });
  });
});
