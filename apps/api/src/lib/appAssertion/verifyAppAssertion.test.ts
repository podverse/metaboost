import type { Request } from 'express';

import { describe, expect, it, vi } from 'vitest';

import { AppRegistryService } from '../appRegistry/AppRegistryService.js';
import {
  parseAppAssertionToken,
  requestPathname,
  verifyAppAssertionForPostRequest,
} from './verifyAppAssertion.js';

function makeUnsignedJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.signature`;
}

function makeRequest(
  authorizationHeader: string | undefined,
  originalUrl: string,
  rawBody: string
): Request {
  return {
    headers: authorizationHeader === undefined ? {} : { authorization: authorizationHeader },
    method: 'POST',
    originalUrl,
    url: originalUrl,
    rawBody: Buffer.from(rawBody, 'utf8'),
  } as Request;
}

function makeRegistry(): AppRegistryService {
  return new AppRegistryService({
    registryBaseUrl: 'https://registry.example.invalid',
    pollIntervalMs: 60_000,
    fetchTimeoutMs: 5_000,
  });
}

describe('parseAppAssertionToken', () => {
  it('returns null for missing and empty values', () => {
    expect(parseAppAssertionToken(undefined)).toBeNull();
    expect(parseAppAssertionToken('')).toBeNull();
    expect(parseAppAssertionToken('   ')).toBeNull();
  });

  it('extracts token for scheme regardless of case and spacing', () => {
    expect(parseAppAssertionToken('AppAssertion token-1')).toBe('token-1');
    expect(parseAppAssertionToken('  appassertion   token-2  ')).toBe('token-2');
  });
});

describe('requestPathname', () => {
  it('strips query string and preserves leading slash', () => {
    const req = { originalUrl: '/v1/messages?sort=desc', url: '/fallback' } as Request;
    expect(requestPathname(req)).toBe('/v1/messages');
  });

  it('adds leading slash when original path does not include one', () => {
    const req = { originalUrl: 'v1/messages', url: 'v1/messages' } as Request;
    expect(requestPathname(req)).toBe('/v1/messages');
  });
});

describe('verifyAppAssertionForPostRequest', () => {
  it('returns 401 when AppAssertion authorization header is missing', async () => {
    const result = await verifyAppAssertionForPostRequest({
      req: makeRequest(undefined, '/api/v1/messages', '{}'),
      registry: makeRegistry(),
    });
    expect(result).toEqual({
      ok: false,
      status: 401,
      body: {
        message: 'AppAssertion JWT is required for this request.',
        errorCode: 'app_assertion_required',
      },
    });
  });

  it('returns 401 when token is decodable but missing iss', async () => {
    const registry = makeRegistry();
    const loadSpy = vi.spyOn(registry, 'loadAppRecord');
    const token = makeUnsignedJwt({ sub: 'missing-iss' });
    const result = await verifyAppAssertionForPostRequest({
      req: makeRequest(`AppAssertion ${token}`, '/api/v1/messages', '{}'),
      registry,
    });
    expect(result).toEqual({
      ok: false,
      status: 401,
      body: {
        message: 'AppAssertion JWT is missing a valid iss claim.',
        errorCode: 'app_assertion_invalid',
      },
    });
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('returns 403 when app is not found in registry', async () => {
    const registry = makeRegistry();
    vi.spyOn(registry, 'loadAppRecord').mockResolvedValue({ ok: false, reason: 'not_found' });
    const token = makeUnsignedJwt({ iss: 'app-not-found' });
    const result = await verifyAppAssertionForPostRequest({
      req: makeRequest(`AppAssertion ${token}`, '/api/v1/messages', '{}'),
      registry,
    });
    expect(result).toEqual({
      ok: false,
      status: 403,
      body: {
        message: 'App is not registered in the Metaboost registry.',
        errorCode: 'app_not_registered',
      },
    });
  });

  it('returns 503 when registry is unavailable', async () => {
    const registry = makeRegistry();
    vi.spyOn(registry, 'loadAppRecord').mockResolvedValue({ ok: false, reason: 'unavailable' });
    const token = makeUnsignedJwt({ iss: 'app-unavailable' });
    const result = await verifyAppAssertionForPostRequest({
      req: makeRequest(`AppAssertion ${token}`, '/api/v1/messages', '{}'),
      registry,
    });
    expect(result).toEqual({
      ok: false,
      status: 503,
      body: {
        message: 'Metaboost registry could not be reached; try again later.',
        errorCode: 'registry_unavailable',
      },
    });
  });

  it('returns 403 when app status is suspended', async () => {
    const registry = makeRegistry();
    vi.spyOn(registry, 'loadAppRecord').mockResolvedValue({
      ok: true,
      record: {
        app_id: 'app-suspended',
        display_name: 'Suspended app',
        owner: { name: 'Owner', email: 'owner@example.invalid' },
        status: 'suspended',
        signing_keys: [],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    });
    const token = makeUnsignedJwt({ iss: 'app-suspended' });
    const result = await verifyAppAssertionForPostRequest({
      req: makeRequest(`AppAssertion ${token}`, '/api/v1/messages', '{}'),
      registry,
    });
    expect(result).toEqual({
      ok: false,
      status: 403,
      body: {
        message: 'App is suspended or revoked.',
        errorCode: 'app_suspended',
      },
    });
  });

  it('returns 403 when app has no active signing keys', async () => {
    const registry = makeRegistry();
    vi.spyOn(registry, 'loadAppRecord').mockResolvedValue({
      ok: true,
      record: {
        app_id: 'app-no-active-keys',
        display_name: 'No active keys',
        owner: { name: 'Owner', email: 'owner@example.invalid' },
        status: 'active',
        signing_keys: [],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    });
    const token = makeUnsignedJwt({ iss: 'app-no-active-keys' });
    const result = await verifyAppAssertionForPostRequest({
      req: makeRequest(`AppAssertion ${token}`, '/api/v1/messages', '{}'),
      registry,
    });
    expect(result).toEqual({
      ok: false,
      status: 403,
      body: {
        message: 'No active signing keys for this app.',
        errorCode: 'app_not_registered',
      },
    });
  });
});
