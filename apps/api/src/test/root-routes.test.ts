import request from 'supertest';
/**
 * API integration tests: unversioned and versioned root routes and health.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../config/index.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;

describe('API root routes', () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;

  beforeAll(async () => {
    app = await createApiTestApp();
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
  });

  it('GET / (unversioned root) returns 200 with basic success message', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toEqual({ status: 'ok', message: 'API is online' });
  });

  it('GET /health returns 200 with status and generic message', async () => {
    const res = await request(app).get(`${API}/health`).expect(200);
    expect(res.body).toEqual({ status: 'ok', message: 'The server is running.' });
  });

  it('GET / (versioned root) returns 200 with basic success message', async () => {
    const res = await request(app).get(`${API}/`).expect(200);
    expect(res.body).toEqual({ status: 'ok', message: 'API is online' });
  });
});
