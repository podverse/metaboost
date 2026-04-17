import type { AppAssertionClaims } from '../types.js';

import { importPKCS8, SignJWT } from 'jose';

/**
 * Signs an AppAssertion JWT with Ed25519 (`alg: EdDSA`, `typ: JWT`).
 * Pass a PKCS#8 PEM private key (e.g. from openssl `genpkey -algorithm ed25519`).
 */
export async function signAppAssertion(options: {
  claims: AppAssertionClaims;
  privateKeyPem: string;
}): Promise<string> {
  const pem = options.privateKeyPem.trim();
  if (pem.length === 0) {
    throw new Error('metaboost-signing: privateKeyPem must be a non-empty PEM string.');
  }

  const key = await importPKCS8(pem, 'EdDSA');
  const c = options.claims;

  const jwt = await new SignJWT({
    jti: c.jti,
    m: c.m,
    p: c.p,
    bh: c.bh,
    ...(c.app_ver !== undefined ? { app_ver: c.app_ver } : {}),
  })
    .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
    .setIssuer(c.iss)
    .setIssuedAt(c.iat)
    .setExpirationTime(c.exp)
    .sign(key);

  return jwt;
}
