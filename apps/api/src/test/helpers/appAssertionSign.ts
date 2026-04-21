import { createHash, randomUUID } from 'crypto';
import { importPKCS8, SignJWT } from 'jose';

/**
 * Build a compact AppAssertion JWT for integration tests (matches public signing spec).
 */
export async function signAppAssertionForTests(options: {
  privateKeyPem: string;
  appId: string;
  pathname: string;
  rawBodyUtf8: string;
  jti?: string;
}): Promise<string> {
  const bh = createHash('sha256').update(options.rawBodyUtf8, 'utf8').digest('hex');
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 120;
  const jti = options.jti ?? randomUUID();
  const key = await importPKCS8(options.privateKeyPem.trim(), 'EdDSA');
  return new SignJWT({
    jti,
    m: 'POST',
    p: options.pathname,
    bh,
  })
    .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
    .setIssuer(options.appId)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(key);
}
