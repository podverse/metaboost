import type { AppRegistryService } from '../appRegistry/AppRegistryService.js';
import type { RegistryAppRecord, RegistrySigningKey } from '../appRegistry/types.js';
import type { Request } from 'express';
import type { JWTPayload } from 'jose';

import { createHash } from 'crypto';
import { decodeJwt, errors, importJWK, jwtVerify } from 'jose';

import { tryRegisterAppAssertionNonce } from '../valkey/replayStore.js';
import {
  APP_ASSERTION_AUTH_SCHEME,
  APP_ASSERTION_CLOCK_TOLERANCE_SECONDS,
  APP_ASSERTION_MAX_TTL_SECONDS,
} from './constants.js';

export function parseAppAssertionToken(authorizationHeader: string | undefined): string | null {
  if (authorizationHeader === undefined || authorizationHeader.trim() === '') {
    return null;
  }
  const m = authorizationHeader.match(
    new RegExp(`^\\s*${APP_ASSERTION_AUTH_SCHEME}\\s+(.+?)\\s*$`, 'i')
  );
  return m?.[1] ?? null;
}

export function requestPathname(req: Request): string {
  const raw = req.originalUrl ?? req.url ?? '';
  const pathOnly = raw.split('?')[0] ?? '';
  if (pathOnly.startsWith('/')) {
    return pathOnly;
  }
  return `/${pathOnly}`;
}

function isActiveOkpKey(k: RegistrySigningKey): boolean {
  return k.status === 'active' && k.kty === 'OKP' && k.crv === 'Ed25519' && k.alg === 'EdDSA';
}

export async function verifyAppAssertionForPostRequest(options: {
  req: Request;
  registry: AppRegistryService;
}): Promise<
  | { ok: true }
  | {
      ok: false;
      status: number;
      body: { message: string; errorCode: string };
    }
> {
  const { req, registry } = options;
  const token = parseAppAssertionToken(req.headers.authorization);
  if (token === null) {
    return {
      ok: false,
      status: 401,
      body: {
        message: 'AppAssertion JWT is required for this request.',
        errorCode: 'app_assertion_required',
      },
    };
  }

  let iss: string;
  try {
    const decoded = decodeJwt(token);
    if (typeof decoded.iss !== 'string' || decoded.iss.trim() === '') {
      return {
        ok: false,
        status: 401,
        body: {
          message: 'AppAssertion JWT is missing a valid iss claim.',
          errorCode: 'app_assertion_invalid',
        },
      };
    }
    iss = decoded.iss;
  } catch {
    return {
      ok: false,
      status: 401,
      body: {
        message: 'AppAssertion JWT could not be decoded.',
        errorCode: 'app_assertion_invalid',
      },
    };
  }

  const loaded = await registry.loadAppRecord(iss);
  if (!loaded.ok) {
    if (loaded.reason === 'not_found') {
      return {
        ok: false,
        status: 403,
        body: {
          message: 'App is not registered in the Metaboost registry.',
          errorCode: 'app_not_registered',
        },
      };
    }
    return {
      ok: false,
      status: 503,
      body: {
        message: 'Metaboost registry could not be reached; try again later.',
        errorCode: 'registry_unavailable',
      },
    };
  }

  const record: RegistryAppRecord = loaded.record;
  if (record.status === 'suspended' || record.status === 'revoked') {
    return {
      ok: false,
      status: 403,
      body: {
        message: 'App is suspended or revoked.',
        errorCode: 'app_suspended',
      },
    };
  }

  const activeKeys = record.signing_keys.filter(isActiveOkpKey);
  if (activeKeys.length === 0) {
    return {
      ok: false,
      status: 403,
      body: {
        message: 'No active signing keys for this app.',
        errorCode: 'app_not_registered',
      },
    };
  }

  let payload: JWTPayload | undefined;
  let lastVerifyError: unknown;
  for (const sk of activeKeys) {
    try {
      const key = await importJWK({ kty: 'OKP', crv: 'Ed25519', x: sk.x, alg: 'EdDSA' });
      const verified = await jwtVerify(token, key, {
        issuer: iss,
        clockTolerance: APP_ASSERTION_CLOCK_TOLERANCE_SECONDS,
        algorithms: ['EdDSA'],
      });
      payload = verified.payload;
      lastVerifyError = undefined;
      break;
    } catch (e) {
      lastVerifyError = e;
    }
  }

  if (payload === undefined) {
    if (lastVerifyError instanceof errors.JWTExpired) {
      return {
        ok: false,
        status: 401,
        body: {
          message: 'AppAssertion JWT has expired.',
          errorCode: 'app_assertion_expired',
        },
      };
    }
    return {
      ok: false,
      status: 401,
      body: {
        message: 'AppAssertion JWT signature or claims are invalid.',
        errorCode: 'app_assertion_invalid',
      },
    };
  }

  const iat = payload.iat;
  const exp = payload.exp;
  if (typeof iat !== 'number' || typeof exp !== 'number') {
    return {
      ok: false,
      status: 401,
      body: {
        message: 'AppAssertion JWT is missing iat or exp.',
        errorCode: 'app_assertion_invalid',
      },
    };
  }

  if (exp - iat > APP_ASSERTION_MAX_TTL_SECONDS) {
    return {
      ok: false,
      status: 401,
      body: {
        message: `AppAssertion TTL exceeds ${APP_ASSERTION_MAX_TTL_SECONDS} seconds.`,
        errorCode: 'app_assertion_invalid',
      },
    };
  }

  const method = req.method.toUpperCase();
  const pathname = requestPathname(req);
  if (payload.m !== method || payload.p !== pathname) {
    return {
      ok: false,
      status: 401,
      body: {
        message: 'AppAssertion request binding failed (method or path mismatch).',
        errorCode: 'app_assertion_binding_failed',
      },
    };
  }

  const raw = req.rawBody;
  if (raw === undefined) {
    return {
      ok: false,
      status: 401,
      body: {
        message: 'Request body was not available for binding verification.',
        errorCode: 'app_assertion_binding_failed',
      },
    };
  }

  const bodyHex = createHash('sha256').update(raw).digest('hex');
  if (typeof payload.bh !== 'string' || payload.bh.toLowerCase() !== bodyHex) {
    return {
      ok: false,
      status: 401,
      body: {
        message: 'AppAssertion body hash (bh) does not match request body.',
        errorCode: 'app_assertion_binding_failed',
      },
    };
  }

  if (typeof payload.jti !== 'string' || payload.jti.trim() === '') {
    return {
      ok: false,
      status: 401,
      body: {
        message: 'AppAssertion JWT is missing jti.',
        errorCode: 'app_assertion_invalid',
      },
    };
  }

  const nowSec = Date.now() / 1000;
  const ttlSeconds = Math.max(1, Math.ceil(exp + APP_ASSERTION_CLOCK_TOLERANCE_SECONDS - nowSec));
  const firstSeen = await tryRegisterAppAssertionNonce({
    iss,
    jti: payload.jti,
    ttlSeconds,
  });
  if (!firstSeen) {
    return {
      ok: false,
      status: 409,
      body: {
        message: 'AppAssertion jti was already used (replay).',
        errorCode: 'app_assertion_replay',
      },
    };
  }

  return { ok: true };
}
