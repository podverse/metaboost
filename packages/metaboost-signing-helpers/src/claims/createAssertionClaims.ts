import { APP_ASSERTION_MAX_TTL_SECONDS, type AppAssertionClaims } from '../types.js';

const BH_HEX = /^[0-9a-f]{64}$/;

function reject(message: string): never {
  throw new Error(`metaboost-signing-helpers: ${message}`);
}

export type CreateAssertionClaimsInput = {
  iss: string;
  iat: number;
  exp: number;
  jti: string;
  m: string;
  p: string;
  bh: string;
  app_ver?: string;
};

/**
 * Validates inputs and returns canonical {@link AppAssertionClaims} for signing.
 * Does not fetch registry keys or touch the network.
 */
export function createAssertionClaims(input: CreateAssertionClaimsInput): AppAssertionClaims {
  const iss = input.iss.trim();
  if (iss.length === 0) {
    reject('iss must be a non-empty string (registered app_id).');
  }

  if (!Number.isInteger(input.iat) || !Number.isInteger(input.exp)) {
    reject('iat and exp must be integers (Unix epoch seconds).');
  }

  if (input.exp <= input.iat) {
    reject('exp must be greater than iat.');
  }

  const ttl = input.exp - input.iat;
  if (ttl > APP_ASSERTION_MAX_TTL_SECONDS) {
    reject(`exp - iat must be at most ${APP_ASSERTION_MAX_TTL_SECONDS} seconds (got ${ttl}).`);
  }

  const jti = input.jti.trim();
  if (jti.length === 0) {
    reject('jti must be a non-empty string (replay nonce, e.g. UUID v4).');
  }

  if (input.m !== 'POST') {
    reject('m must be the uppercase string POST.');
  }

  const p = input.p.trim();
  if (!p.startsWith('/')) {
    reject('p must be the exact request path starting with / (e.g. /v1/s/...).');
  }
  if (p.includes(' ') || p.includes('\n') || p.includes('\t')) {
    reject('p must not contain whitespace.');
  }

  const bhLower = input.bh.trim().toLowerCase();
  if (!BH_HEX.test(bhLower)) {
    reject(
      'bh must be a 64-character lowercase hexadecimal SHA-256 of the raw body (use hashRequestBody).'
    );
  }

  if (input.app_ver !== undefined) {
    const v = input.app_ver.trim();
    if (v.length === 0) {
      reject('app_ver, if provided, must be a non-empty string.');
    }
  }

  const out: AppAssertionClaims = {
    iss,
    iat: input.iat,
    exp: input.exp,
    jti,
    m: 'POST',
    p,
    bh: bhLower,
  };

  if (input.app_ver !== undefined) {
    out.app_ver = input.app_ver.trim();
  }

  return out;
}
