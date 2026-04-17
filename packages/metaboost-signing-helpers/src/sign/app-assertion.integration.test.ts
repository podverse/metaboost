import { exportPKCS8, exportSPKI, generateKeyPair, importSPKI, jwtVerify } from 'jose';
import { describe, expect, it } from 'vitest';

import { createAssertionClaims } from '../claims/createAssertionClaims.js';
import { hashRequestBody } from '../hash/hashRequestBody.js';
import { buildSignedRequestHeaders } from '../http/buildSignedRequestHeaders.js';
import { signAppAssertion } from './signAppAssertion.js';

describe('AppAssertion end-to-end', () => {
  it('produces a verifiable JWT and Authorization header for a fixture body', async () => {
    const body = Buffer.from(JSON.stringify({ hello: 'world' }), 'utf8');
    const bh = hashRequestBody(body);

    const { privateKey, publicKey: generatedPublic } = await generateKeyPair('EdDSA', {
      extractable: true,
    });
    const privatePem = await exportPKCS8(privateKey);
    const publicPem = await exportSPKI(generatedPublic);

    const iat = Math.floor(Date.now() / 1000);
    const claims = createAssertionClaims({
      iss: 'fixture-app',
      iat,
      exp: iat + 60,
      jti: '11111111-1111-4111-8111-111111111111',
      m: 'POST',
      p: '/v1/s/mbrss-v1/boost/example',
      bh,
    });

    const jwt = await signAppAssertion({
      claims,
      privateKeyPem: privatePem,
    });

    const verifyKey = await importSPKI(publicPem, 'EdDSA');
    const verified = await jwtVerify(jwt, verifyKey, { algorithms: ['EdDSA'] });
    expect(verified.payload.iss).toBe('fixture-app');
    expect(verified.payload.jti).toBe(claims.jti);
    expect(verified.payload.m).toBe('POST');
    expect(verified.payload.p).toBe('/v1/s/mbrss-v1/boost/example');
    expect(verified.payload.bh).toBe(bh);

    const headers = buildSignedRequestHeaders({ jwt });
    expect(headers.Authorization.startsWith('AppAssertion ')).toBe(true);
    expect(headers.Authorization.slice('AppAssertion '.length)).toBe(jwt);
  });
});
