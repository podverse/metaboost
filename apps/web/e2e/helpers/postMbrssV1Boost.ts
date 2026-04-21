import { expect, type APIRequestContext } from '@playwright/test';
import {
  buildSignedRequestHeaders,
  createAssertionClaims,
  hashRequestBody,
  signAppAssertion,
} from 'metaboost-signing';
import { randomUUID } from 'node:crypto';

import { getE2EApiV1BaseUrl } from './apiBase';

/** Registered app for AppAssertion during web E2E; public key in e2e/fixtures/registry-static. */
const E2E_MBRSS_APP_ID = 'metaboost-e2e-web';

/** PKCS#8 PEM for {@link E2E_MBRSS_APP_ID} (test-only; pairs with registry JSON). */
const E2E_MBRSS_PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEICiK2nVn17aV6EZ6XngryewODyOscCC/PzLkICxkESma
-----END PRIVATE KEY-----
`;

/**
 * POST mbrss-v1 boost with a valid AppAssertion (local registry on port 4020).
 */
export async function postMbrssV1Boost(
  request: APIRequestContext,
  bucketShortId: string,
  body: Record<string, unknown>
): Promise<void> {
  const raw = JSON.stringify(body);
  const pathname = `/v1/standard/mbrss-v1/boost/${bucketShortId}`;
  const bh = hashRequestBody(Buffer.from(raw, 'utf8'));
  const iat = Math.floor(Date.now() / 1000);
  const claims = createAssertionClaims({
    iss: E2E_MBRSS_APP_ID,
    iat,
    exp: iat + 120,
    jti: randomUUID(),
    m: 'POST',
    p: pathname,
    bh,
  });
  const jwt = await signAppAssertion({
    claims,
    privateKeyPem: E2E_MBRSS_PRIVATE_KEY_PEM,
  });
  const auth = buildSignedRequestHeaders({ jwt });
  const url = `${getE2EApiV1BaseUrl()}/standard/mbrss-v1/boost/${bucketShortId}`;
  const response = await request.post(url, {
    data: raw,
    headers: {
      ...auth,
      'Content-Type': 'application/json',
    },
  });
  expect(response.ok()).toBe(true);
}
