import request from 'supertest';
/**
 * Management API integration tests: unversioned and versioned root routes and health.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../config/index.js';
import {
  createManagementApiTestApp,
  destroyManagementApiTestDataSources,
} from './helpers/setup.js';

const API = config.apiVersionPath;

describe('Management API root routes', () => {
  let app: Awaited<ReturnType<typeof createManagementApiTestApp>>;

  beforeAll(async () => {
    app = await createManagementApiTestApp();
  });

  afterAll(async () => {
    await destroyManagementApiTestDataSources();
  });

  it('GET / (unversioned root) returns 200 with basic success message', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toEqual({ status: 'ok', message: 'Management API is online' });
  });

  it('GET /health returns 200 with status and generic message', async () => {
    const res = await request(app).get(`${API}/health`).expect(200);
    expect(res.body).toEqual({ status: 'ok', message: 'The server is running.' });
  });

  it('GET /health/ready returns 200 when Valkey checks are skipped (no KEYVALDB_* in test env)', async () => {
    const res = await request(app).get(`${API}/health/ready`).expect(200);
    expect(res.body).toMatchObject({ status: 'ok', message: 'Ready' });
  });

  it('GET /meta returns 200 with the configured version path', async () => {
    const res = await request(app).get(`${API}/meta`).expect(200);
    expect(res.body).toEqual({
      status: 'ok',
      version: API,
      release: process.env.MANAGEMENT_API_RELEASE,
    });
  });

  it('GET / (versioned root) returns 200 with basic success message', async () => {
    const res = await request(app).get(`${API}/`).expect(200);
    expect(res.body).toEqual({ status: 'ok', message: 'Management API is online' });
  });
});
