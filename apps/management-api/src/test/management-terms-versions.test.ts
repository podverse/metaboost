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
});
