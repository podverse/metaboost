import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  appDataSourceRead,
  appDataSourceReadWrite,
  computeTermsContentHash,
  TermsVersion,
} from '@metaboost/orm';

import { config } from '../config/index.js';
import { createManagementLoginAgent } from './helpers/login-agent.js';
import {
  createManagementApiTestAppWithSuperAdmin,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'mgmt-terms-versions';
const superAdminUsername = `${FILE_PREFIX}-super-admin`;
const superAdminPassword = `${FILE_PREFIX}-super-admin-password-1`;

describe('management-api terms versions', () => {
  let app: Awaited<ReturnType<typeof createManagementApiTestAppWithSuperAdmin>>;
  let superAdminAgent: ReturnType<typeof request.agent>;

  beforeAll(async () => {
    app = await createManagementApiTestAppWithSuperAdmin(superAdminUsername, superAdminPassword);
    superAdminAgent = await createManagementLoginAgent(app, {
      username: superAdminUsername,
      password: superAdminPassword,
    });
    const termsVersionRepo = appDataSourceReadWrite.getRepository(TermsVersion);
    await termsVersionRepo
      .createQueryBuilder()
      .update(TermsVersion)
      .set({ status: 'deprecated' })
      .where('status = :status', { status: 'upcoming' })
      .execute();
  });

  afterAll(async () => {
    await destroyManagementApiTestDataSources();
  });

  it('GET /terms-versions returns 401 without auth', async () => {
    await request(app).get(`${API}/terms-versions`).expect(401);
  });

  it('super-admin can create one upcoming terms version and duplicate upcoming is rejected', async () => {
    const ts = Date.now();
    const body = {
      versionKey: `terms-upcoming-${ts}`,
      title: `Upcoming Terms ${ts}`,
      contentTextEnUs: `Upcoming terms content ${ts}`,
      contentTextEs: `Contenido de términos próximo ${ts}`,
      announcementStartsAt: new Date(ts + 24 * 60 * 60 * 1000).toISOString(),
      enforcementStartsAt: new Date(ts + 72 * 60 * 60 * 1000).toISOString(),
      status: 'upcoming',
    } as const;

    const created = await superAdminAgent.post(`${API}/terms-versions`).send(body).expect(201);
    expect(created.body.termsVersion.versionKey).toBe(body.versionKey);
    expect(created.body.termsVersion.status).toBe('upcoming');
    expect(created.body.termsVersion.contentHash).toBe(
      computeTermsContentHash(body.contentTextEnUs, body.contentTextEs)
    );

    const duplicateBody = {
      ...body,
      versionKey: `${body.versionKey}-duplicate`,
    };
    await superAdminAgent.post(`${API}/terms-versions`).send(duplicateBody).expect(409);
  });

  it('promotes upcoming to current and deprecates previous current', async () => {
    const beforeRepo = appDataSourceRead.getRepository(TermsVersion);
    const previousCurrent = await beforeRepo.findOne({ where: { status: 'current' } });
    expect(previousCurrent).not.toBeNull();

    const upcoming = await beforeRepo.findOne({ where: { status: 'upcoming' } });
    expect(upcoming).not.toBeNull();
    if (upcoming === null || previousCurrent === null) {
      throw new Error('Expected both current and upcoming terms versions.');
    }

    const promoted = await superAdminAgent
      .post(`${API}/terms-versions/${upcoming.id}/promote-to-current`)
      .expect(200);
    expect(promoted.body.termsVersion.id).toBe(upcoming.id);
    expect(promoted.body.termsVersion.status).toBe('current');

    const checkRepo = appDataSourceRead.getRepository(TermsVersion);
    const newCurrent = await checkRepo.findOne({ where: { id: upcoming.id } });
    expect(newCurrent?.status).toBe('current');

    const oldCurrent = await checkRepo.findOne({ where: { id: previousCurrent.id } });
    expect(oldCurrent?.status).toBe('deprecated');
  });

  describe('GET /terms-versions/:id', () => {
    it('returns 401 without auth', async () => {
      await request(app)
        .get(`${API}/terms-versions/00000000-0000-0000-0000-000000000000`)
        .expect(401);
    });

    it('returns 200 with terms version when valid id', async () => {
      const repo = appDataSourceRead.getRepository(TermsVersion);
      const current = await repo.findOne({ where: { status: 'current' } });
      expect(current).not.toBeNull();
      if (current === null) return;
      const res = await superAdminAgent.get(`${API}/terms-versions/${current.id}`).expect(200);
      expect(res.body.termsVersion).toBeDefined();
      expect(res.body.termsVersion.id).toBe(current.id);
      expect(res.body.termsVersion).toHaveProperty('versionKey');
      expect(res.body.termsVersion).toHaveProperty('title');
      expect(res.body.termsVersion).toHaveProperty('status');
      expect(res.body.termsVersion).toHaveProperty('contentHash');
      expect(res.body.termsVersion).toHaveProperty('contentTextEnUs');
      expect(res.body.termsVersion).toHaveProperty('contentTextEs');
    });

    it('returns 404 for nonexistent id', async () => {
      await superAdminAgent
        .get(`${API}/terms-versions/00000000-0000-0000-0000-000000000000`)
        .expect(404, { message: 'Terms version not found' });
    });

    it('returns 403 for non-super admin', async () => {
      const ts = Date.now();
      const nonSuperUsername = `mgmt-ar-nsg-${ts}@example.com`;
      const nonSuperPassword = `${FILE_PREFIX}-nonsuper-pw`;
      await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: nonSuperUsername,
          password: nonSuperPassword,
          displayName: `Non Super Get ${ts}`,
          adminsCrud: 15,
          usersCrud: 15,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      const nonSuperAgent = await createManagementLoginAgent(app, {
        username: nonSuperUsername,
        password: nonSuperPassword,
      });
      const repo = appDataSourceRead.getRepository(TermsVersion);
      const current = await repo.findOne({ where: { status: 'current' } });
      expect(current).not.toBeNull();
      if (current === null) return;
      await nonSuperAgent.get(`${API}/terms-versions/${current.id}`).expect(403);
    });
  });

  describe('PATCH /terms-versions/:id', () => {
    it('returns 401 without auth', async () => {
      await request(app)
        .patch(`${API}/terms-versions/00000000-0000-0000-0000-000000000000`)
        .send({ title: 'No Auth' })
        .expect(401);
    });

    it('returns 404 for nonexistent id', async () => {
      await superAdminAgent
        .patch(`${API}/terms-versions/00000000-0000-0000-0000-000000000000`)
        .send({ title: 'Nope' })
        .expect(404, { message: 'Terms version not found' });
    });

    it('returns 400 when updating current terms version', async () => {
      const repo = appDataSourceRead.getRepository(TermsVersion);
      const current = await repo.findOne({ where: { status: 'current' } });
      expect(current).not.toBeNull();
      if (current === null) return;
      await superAdminAgent
        .patch(`${API}/terms-versions/${current.id}`)
        .send({ title: 'Cannot Update Current' })
        .expect(400, { message: 'Only draft or upcoming terms versions can be updated.' });
    });

    it('returns 200 with updated terms version when body valid', async () => {
      const ts = Date.now();
      const created = await superAdminAgent
        .post(`${API}/terms-versions`)
        .send({
          versionKey: `terms-get-patch-${ts}`,
          title: `Patch Test ${ts}`,
          contentTextEnUs: `Patch content en ${ts}`,
          contentTextEs: `Patch content es ${ts}`,
          enforcementStartsAt: new Date(ts + 72 * 60 * 60 * 1000).toISOString(),
          status: 'draft',
        })
        .expect(201);
      const id = created.body.termsVersion.id;

      const updatedTitle = `Updated Title ${ts}`;
      const res = await superAdminAgent
        .patch(`${API}/terms-versions/${id}`)
        .send({ title: updatedTitle, contentTextEnUs: `Updated en ${ts}` })
        .expect(200);
      expect(res.body.termsVersion.title).toBe(updatedTitle);
    });

    it('returns 400 when body is empty', async () => {
      const ts = Date.now();
      const created = await superAdminAgent
        .post(`${API}/terms-versions`)
        .send({
          versionKey: `terms-empty-body-${ts}`,
          title: `Empty Body ${ts}`,
          contentTextEnUs: `Empty body content en ${ts}`,
          contentTextEs: `Empty body content es ${ts}`,
          enforcementStartsAt: new Date(ts + 72 * 60 * 60 * 1000).toISOString(),
          status: 'draft',
        })
        .expect(201);
      const id = created.body.termsVersion.id;
      await superAdminAgent.patch(`${API}/terms-versions/${id}`).send({}).expect(400);
    });

    it('returns 403 for non-super admin', async () => {
      const ts = Date.now();
      const nonSuperUsername = `mgmt-ar-nsp-${ts}@example.com`;
      const nonSuperPassword = `${FILE_PREFIX}-nonsuper-pw`;
      await superAdminAgent
        .post(`${API}/admins`)
        .send({
          username: nonSuperUsername,
          password: nonSuperPassword,
          displayName: `Non Super Patch ${ts}`,
          adminsCrud: 15,
          usersCrud: 15,
          eventVisibility: 'all_admins',
        })
        .expect(201);
      const nonSuperAgent = await createManagementLoginAgent(app, {
        username: nonSuperUsername,
        password: nonSuperPassword,
      });
      const repo = appDataSourceRead.getRepository(TermsVersion);
      const draft = await repo.findOne({ where: { status: 'draft' } });
      if (draft === null) return;
      await nonSuperAgent
        .patch(`${API}/terms-versions/${draft.id}`)
        .send({ title: 'Blocked' })
        .expect(403);
    });
  });
});
