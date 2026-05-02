/**
 * Integration tests: HTTPS enforcement for versioned `/standard/*` (Standard Endpoint).
 */
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { config } from '../config/index.js';
import { createApiTestApp, destroyApiTestDataSources } from './helpers/setup.js';

const API = config.apiVersionPath;
const FILE_PREFIX = 'standard-https';

describe(`standard endpoint HTTPS enforcement (${FILE_PREFIX})`, () => {
  let app: Awaited<ReturnType<typeof createApiTestApp>>;
  let savedRequire: string | undefined;
  let savedTrust: string | undefined;

  beforeAll(async () => {
    app = await createApiTestApp();
  });

  afterAll(async () => {
    await destroyApiTestDataSources();
  });

  const openapiPathMbrss = `${API}/standard/mbrss-v1/openapi.json`;
  const openapiPathMbV1 = `${API}/standard/mb-v1/openapi.json`;

  it('allows HTTP when enforcement is off (NODE_ENV=test)', async () => {
    await request(app).get(openapiPathMbrss).expect(200);
    await request(app).get(openapiPathMbV1).expect(200);
  });

  it('returns 403 https_required when enforcement is on and connection is HTTP', async () => {
    savedRequire = process.env.STANDARD_ENDPOINT_REQUIRE_HTTPS;
    savedTrust = process.env.STANDARD_ENDPOINT_TRUST_PROXY;
    try {
      process.env.STANDARD_ENDPOINT_REQUIRE_HTTPS = 'true';
      process.env.STANDARD_ENDPOINT_TRUST_PROXY = 'false';
      for (const openApiPath of [openapiPathMbrss, openapiPathMbV1]) {
        const res = await request(app).get(openApiPath).expect(403);
        expect(res.body.errorCode).toBe('https_required');
        expect(String(res.body.message)).toMatch(/HTTPS is required/i);
      }
    } finally {
      process.env.STANDARD_ENDPOINT_REQUIRE_HTTPS = savedRequire;
      process.env.STANDARD_ENDPOINT_TRUST_PROXY = savedTrust;
    }
  });

  it('accepts cleartext to the app when trust proxy is on and X-Forwarded-Proto is https', async () => {
    savedRequire = process.env.STANDARD_ENDPOINT_REQUIRE_HTTPS;
    savedTrust = process.env.STANDARD_ENDPOINT_TRUST_PROXY;
    try {
      process.env.STANDARD_ENDPOINT_REQUIRE_HTTPS = 'true';
      process.env.STANDARD_ENDPOINT_TRUST_PROXY = 'true';
      await request(app).get(openapiPathMbrss).set('X-Forwarded-Proto', 'https').expect(200);
      await request(app).get(openapiPathMbV1).set('X-Forwarded-Proto', 'https').expect(200);
    } finally {
      process.env.STANDARD_ENDPOINT_REQUIRE_HTTPS = savedRequire;
      process.env.STANDARD_ENDPOINT_TRUST_PROXY = savedTrust;
    }
  });
});
