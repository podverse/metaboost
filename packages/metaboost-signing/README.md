# metaboost-signing

Framework-agnostic helpers for minting **AppAssertion** JWTs for `POST /v1/standard/*` on Metaboost, per [docs/api/STANDARD-ENDPOINT-APP-SIGNING.md](../../docs/api/STANDARD-ENDPOINT-APP-SIGNING.md).

## Install

```bash
npm install metaboost-signing
```

Published to the **public npm registry** (`https://registry.npmjs.org`). Distribution, versioning, and release workflow: [docs/api/METABOOST-SIGNING-DISTRIBUTION.md](../../docs/api/METABOOST-SIGNING-DISTRIBUTION.md).

**Node.js:** `>= 24.0.0` (see `engines` in `package.json`).

## Security

- **Backend only:** load PEM private keys only on trusted servers. Never ship signing keys to browsers or mobile clients.
- This package **does not** fetch the public registry; callers supply `iss` and key material locally.
- Rotate keys via the public registry process; keep PEM files out of version control.

## API (v1)

Semver applies to this surface; see the distribution doc for stability and upgrade policy.

| Export                      | Role                                               |
| --------------------------- | -------------------------------------------------- |
| `hashRequestBody`           | `bh` claim: SHA-256 hex of exact POST body bytes   |
| `createAssertionClaims`     | Validate inputs and build `AppAssertionClaims`     |
| `signAppAssertion`          | Sign claims with Ed25519 PKCS#8 PEM (`alg: EdDSA`) |
| `buildSignedRequestHeaders` | `Authorization: AppAssertion <jwt>`                |

Constants: `APP_ASSERTION_MAX_TTL_SECONDS` (300).

## More examples

Backend-focused patterns (wrapper, `fetch`, retries, fixtures): [docs/api/STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md](../../docs/api/STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md).

## Usage

```typescript
import {
  buildSignedRequestHeaders,
  createAssertionClaims,
  hashRequestBody,
  signAppAssertion,
} from 'metaboost-signing';

const body = Buffer.from(JSON.stringify({ foo: 'bar' }), 'utf8');
const bh = hashRequestBody(body);
const iat = Math.floor(Date.now() / 1000);
const claims = createAssertionClaims({
  iss: 'my-app-id',
  iat,
  exp: iat + 120,
  jti: crypto.randomUUID(),
  m: 'POST',
  p: '/v1/standard/mbrss-v1/boost/…',
  bh,
});
const jwt = await signAppAssertion({
  claims,
  privateKeyPem: process.env.METABOOST_SIGNING_KEY_PEM!,
});
const headers = buildSignedRequestHeaders({ jwt });
// fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body });
```

## Scripts (monorepo contributors)

From repository root: `npm run build -w metaboost-signing`, `npm run test -w metaboost-signing`.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)
