# Standard Endpoint — consumer examples (backend)

Copy-paste oriented examples for **third-party backends** using **`@podverse/metaboost-signing`** with
**`POST /v1/standard/*`**. Protocol details: [STANDARD-ENDPOINT-APP-SIGNING.md](./STANDARD-ENDPOINT-APP-SIGNING.md).
Onboarding: [STANDARD-ENDPOINT-INTEGRATION-GUIDE.md](./STANDARD-ENDPOINT-INTEGRATION-GUIDE.md).

## 1. Basic signed `POST` helper

Build the exact body buffer, hash it, mint claims, sign, then send with `Authorization` and the
**same** buffer as the request body.

```typescript
import {
  buildSignedRequestHeaders,
  createAssertionClaims,
  hashRequestBody,
  signAppAssertion,
} from '@podverse/metaboost-signing';

const path = '/v1/standard/mbrss-v1/boost/yourBucketId';
const body = Buffer.from(
  JSON.stringify({
    currency: 'BTC',
    amount: 1000,
    action: 'boost',
    app_name: 'YourApp',
    feed_guid: '…',
    feed_title: '…',
    sender_guid: '…',
  }),
  'utf8'
);

const bh = hashRequestBody(body);
const iat = Math.floor(Date.now() / 1000);
const jwt = await signAppAssertion({
  claims: createAssertionClaims({
    iss: process.env.METABOOST_APP_ID!,
    iat,
    exp: iat + 120,
    jti: crypto.randomUUID(),
    m: 'POST',
    p: path,
    bh,
  }),
  privateKeyPem: process.env.METABOOST_SIGNING_KEY_PEM!,
});

const url = new URL(path, 'https://your-metaboost-host.example').toString();
await fetch(url, {
  method: 'POST',
  headers: {
    ...buildSignedRequestHeaders({ jwt }),
    'Content-Type': 'application/json',
  },
  body,
});
```

## 2. Reusable request wrapper

Separate **signing** from **transport** so you can plug in `fetch`, `axios`, or `got`.

```typescript
import {
  buildSignedRequestHeaders,
  createAssertionClaims,
  hashRequestBody,
  signAppAssertion,
} from '@podverse/metaboost-signing';

export type SignedStandardPostInput = {
  baseUrl: string;
  path: string;
  body: Buffer;
  iss: string;
  privateKeyPem: string;
  ttlSeconds?: number;
};

export async function signedStandardPostHeaders(input: SignedStandardPostInput): Promise<{
  url: string;
  headers: Record<string, string>;
  body: Buffer;
}> {
  const ttl = input.ttlSeconds ?? 120;
  const bh = hashRequestBody(input.body);
  const iat = Math.floor(Date.now() / 1000);
  const claims = createAssertionClaims({
    iss: input.iss,
    iat,
    exp: iat + ttl,
    jti: crypto.randomUUID(),
    m: 'POST',
    p: input.path,
    bh,
  });
  const jwt = await signAppAssertion({ claims, privateKeyPem: input.privateKeyPem });
  const auth = buildSignedRequestHeaders({ jwt });
  const url = new URL(input.path, input.baseUrl).toString();
  return {
    url,
    body: input.body,
    headers: {
      ...auth,
      'Content-Type': 'application/json',
    },
  };
}
```

## 3. `fetch` vs generic options (axios / got)

**Native `fetch`** — use `Buffer` or `Uint8Array` body consistent with `hashRequestBody`.

```typescript
const { url, headers, body } = await signedStandardPostHeaders({
  baseUrl: 'https://api.example.com',
  path: '/v1/standard/mbrss-v1/boost/abc',
  body: canonicalBodyBuffer,
  iss: 'my-app',
  privateKeyPem: process.env.METABOOST_SIGNING_KEY_PEM!,
});

await fetch(url, { method: 'POST', headers, body });
```

**Axios-style** — map the same `headers` and pass `data` as the **raw** buffer or string that was
hashed (avoid serializers that reorder keys).

```typescript
// axios({ method: 'POST', url, headers, data: body, transformRequest: [(d) => d] })
```

**Rule:** Whatever you pass to `hashRequestBody` must be the **wire bytes** of the request body.

## 4. Error handling and retries

Align with [STANDARD-ENDPOINT-INTEGRATION-GUIDE.md](./STANDARD-ENDPOINT-INTEGRATION-GUIDE.md#error-handling-and-retries):

- **`app_assertion_replay` (409):** mint a **new** `jti` and new JWT; do not retry the same token.
- **`app_rate_limited` (429):** backoff with jitter.
- **`app_assertion_invalid` / `app_assertion_binding_failed`:** fix body/path/method/clock before
  retrying.

```typescript
async function postWithAssertionOnce(
  input: SignedStandardPostInput
): Promise<Response> {
  const { url, headers, body } = await signedStandardPostHeaders(input);
  return fetch(url, { method: 'POST', headers, body });
}
```

## 5. Security patterns

- **Load PEM from env or secret manager** in process startup only on servers that sign.

  ```typescript
  function loadSigningPem(): string {
    const pem = process.env.METABOOST_SIGNING_KEY_PEM;
    if (pem === undefined || pem.trim() === '') {
      throw new Error('METABOOST_SIGNING_KEY_PEM is required');
    }
    return pem;
  }
  ```

- **Never** import signing code or PEM into browser bundles or React Native client-only modules.
- **Rotation stub:** update registry `signing_keys[]`, deploy new PEM, revoke old key after traffic
  drains; dual-key periods are operational — keep one active key per environment when possible.

## 6. Stable fixtures (for tests and docs)

Monorepo files (used by `@podverse/metaboost-signing` contract test):

- [`packages/metaboost-signing/fixtures/consumer-example-post-body.json`](../../packages/metaboost-signing/fixtures/consumer-example-post-body.json)
- [`packages/metaboost-signing/fixtures/consumer-example-meta.json`](../../packages/metaboost-signing/fixtures/consumer-example-meta.json)

The **`bh`** in `consumer-example-meta.json` is the SHA-256 hex of the **exact** post-body file
bytes. **`p`** is example **`/v1/standard/mbrss-v1/boost/exampleBucketId`**. **`m`** is **`POST`**.

## See also

- [METABOOST-SIGNING-DISTRIBUTION.md](./METABOOST-SIGNING-DISTRIBUTION.md)
- Package README: [`packages/metaboost-signing/README.md`](../../packages/metaboost-signing/README.md)
