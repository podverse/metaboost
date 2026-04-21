import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../app.js';

const FOREIGN_ORIGIN = 'http://localhost:3002';
const STANDARD_OPENAPI_PATHS = [
  '/v1/standard/mbrss-v1/openapi.json',
  '/v1/standard/mb-v1/openapi.json',
];
const PUBLIC_BROWSER_READABLE_PATHS = [
  ...STANDARD_OPENAPI_PATHS,
  '/v1/buckets/public/test-bucket-id/conversion',
];

describe('CORS path routing', () => {
  const app = createApp();

  it('reflects Origin on GET /v1/standard/* (public standards) when Origin is not in API_CORS_ORIGINS', async () => {
    for (const openApiPath of STANDARD_OPENAPI_PATHS) {
      const res = await request(app).get(openApiPath).set('Origin', FOREIGN_ORIGIN).expect(200);
      expect(res.headers['access-control-allow-origin']).toBe(FOREIGN_ORIGIN);
    }
  });

  it('does not reflect foreign Origin on GET /v1/health (outside /standard/)', async () => {
    const res = await request(app).get('/v1/health').set('Origin', FOREIGN_ORIGIN).expect(200);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('handles OPTIONS preflight for public browser-readable paths with foreign Origin', async () => {
    for (const path of PUBLIC_BROWSER_READABLE_PATHS) {
      const res = await request(app)
        .options(path)
        .set('Origin', FOREIGN_ORIGIN)
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);
      expect(res.headers['access-control-allow-origin']).toBe(FOREIGN_ORIGIN);
    }
  });

  it('does not allow foreign Origin on OPTIONS preflight for /v1/health', async () => {
    const res = await request(app)
      .options('/v1/health')
      .set('Origin', FOREIGN_ORIGIN)
      .set('Access-Control-Request-Method', 'GET')
      .expect(204);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
