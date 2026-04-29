# Standard Endpoint — integrator guide (npm helpers)

**Start here (full linear path, any stack):** [METABOOST-APP-INTEGRATOR-QUICKSTART.md](./METABOOST-APP-INTEGRATOR-QUICKSTART.md).

This guide walks through registering an app, installing **`metaboost-signing`**, and sending
signed **`POST`** requests to Metaboost **`/v1/standard/*`**. Assertion format, claims, and error
semantics are defined in [STANDARD-ENDPOINT-APP-SIGNING.md](./STANDARD-ENDPOINT-APP-SIGNING.md);
this document focuses on **onboarding**, **implementation order**, and **troubleshooting**.

## Prerequisites

- **Node.js** `>= 24.0.0` on the machine that signs requests (your backend or build agent).
- A **backend-only** place to hold the **Ed25519 private key** (PKCS#8 PEM). Never ship the private
  key to browsers or mobile clients.
- The **exact** JSON bytes you will send: Metaboost hashes the **raw body** for claim `bh`; any
  transformation after signing breaks verification.
- Network path to Metaboost over **HTTPS** in non-local deployments (see
  [HTTPS enforcement](#https-enforcement-failures)).

## Registry onboarding

Metaboost verifies signatures using **public keys** published in the **[metaboost-registry](https://github.com/v4v-io/metaboost-registry)**
repository.

1. Read the registry contract: [`SCHEMA.md`](https://github.com/v4v-io/metaboost-registry/blob/main/docs/SCHEMA.md)
   and contributor onboarding: [`ONBOARDING.md`](https://github.com/v4v-io/metaboost-registry/blob/main/docs/ONBOARDING.md).
2. Create or update your app record under `registry/apps/<app_id>.app.json` using the tooling described
   in [`FIRST-APP-SUBMISSION.md`](https://github.com/v4v-io/metaboost-registry/blob/main/docs/FIRST-APP-SUBMISSION.md).
3. Open a PR; required CI (**`validate-registry`**) must pass before merge.
4. After merge, Metaboost will pick up your **`app_id`** and **`signing_keys[]`** on its next registry
   poll (see env **`STANDARD_ENDPOINT_REGISTRY_*`** in [ENV-REFERENCE.md](../development/ENV-REFERENCE.md)).

Until your app is **active** in the registry, signed requests may fail with **`app_not_registered`**
or **`app_suspended`**.

## Backend helper integration

### Install

```bash
npm install metaboost-signing
```

Publish and semver policy: [METABOOST-SIGNING-DISTRIBUTION.md](./METABOOST-SIGNING-DISTRIBUTION.md).

### Configure the signing key

Load your PKCS#8 PEM from a secret store or environment (example: `METABOOST_SIGNING_KEY_PEM`). Do not
commit PEM files. Rotate keys by updating the registry record and deploying the new private key to
your backend.

### Public exports (v1)

| Export                          | Role                                         |
| ------------------------------- | -------------------------------------------- |
| `hashRequestBody`               | Compute `bh` (SHA-256 hex of raw body bytes) |
| `createAssertionClaims`         | Validate inputs and build claims             |
| `signAppAssertion`              | Sign with Ed25519 PEM (`alg: EdDSA`)         |
| `buildSignedRequestHeaders`     | `Authorization: AppAssertion <jwt>`          |
| `APP_ASSERTION_MAX_TTL_SECONDS` | Max JWT lifetime (300 seconds)               |

## Request-signing flow

1. **Serialize** the JSON body to a `Buffer` (or `Uint8Array`) exactly as it will appear on the wire.
2. **`bh`** — `hashRequestBody(body)`.
3. **`p`** — exact URL **path** (including `/v1/standard/...`), no query string. Must match the HTTP
   request line path character-for-character.
4. **`iss`** — your registered **`app_id`**.
5. **`iat` / `exp`** — Unix epoch seconds; **`exp - iat` ≤ `APP_ASSERTION_MAX_TTL_SECONDS`**.
6. **`jti`** — new UUID (v4) per request; used for replay protection.
7. **`m`** — always **`POST`** for Standard Endpoint writes today.
8. **`createAssertionClaims({ ... })`** then **`signAppAssertion({ claims, privateKeyPem })`**.
9. **`buildSignedRequestHeaders({ jwt })`** and merge with **`Content-Type: application/json`**.

Minimal shape (aligns with package README):

```typescript
import {
  buildSignedRequestHeaders,
  createAssertionClaims,
  hashRequestBody,
  signAppAssertion,
} from 'metaboost-signing';

const body = Buffer.from(JSON.stringify({ /* your payload */ }), 'utf8');
const bh = hashRequestBody(body);
const iat = Math.floor(Date.now() / 1000);
const claims = createAssertionClaims({
  iss: 'your-app-id',
  iat,
  exp: iat + 120,
  jti: crypto.randomUUID(),
  m: 'POST',
  p: '/v1/standard/mbrss-v1/boost/your-boost-id',
  bh,
});
const jwt = await signAppAssertion({
  claims,
  privateKeyPem: process.env.METABOOST_SIGNING_KEY_PEM!,
});
const headers = buildSignedRequestHeaders({ jwt });
```

## Calling `/v1/standard/*` endpoints

- **Method:** `POST`.
- **Header:** `Authorization: AppAssertion <jwt>` (use `buildSignedRequestHeaders` output).
- **Header:** `Content-Type: application/json`.
- **Body:** the **same** byte sequence used for `hashRequestBody`.
- **Path:** must match claim **`p`** exactly. Typical mbrss-v1 routes live under
  **`/v1/standard/mbrss-v1/...`** (not the legacy `/v1/s/` prefix).

For public message reads (`GET /v1/standard/*/messages/public/...`), apps can optionally pass
`minimumAmountMinor` to request a minimum amount filter in root preferred-currency minor units.
The server applies the greater of this query value and the bucket root threshold configured by the
bucket owner/admin.

## Capability threshold + conversion metadata

Capability responses for `mb-v1` and `mbrss-v1` include:

- `preferred_currency` — root preferred currency used for threshold comparisons.
- `minimum_message_amount_minor` — root threshold in preferred-currency minor units.
- `conversion_endpoint_url` — public endpoint returning cached **conversion ratio metadata** for the bucket’s preferred currency (`source_currency` + `amount_unit`). Clients multiply amounts locally; the server does not compute per-request converted minor amounts.

When sending amounts from another currency, fetch ratio metadata from the conversion endpoint before deciding whether
name/message inputs should be enabled client-side.

Example conversion request:

```text
GET /v1/buckets/public/{bucketIdText}/conversion?source_currency=EUR&amount_unit=cents
```

Rules:

- Query params are **`source_currency`** and **`amount_unit`** only (no `source_amount`).
- Response includes **`ratio.sourceMajorToTargetMajor`** / **`ratio.targetMajorToSourceMajor`** (decimal strings), minor-unit exponents, and rate **`metadata`**.
- `amount_unit` is required for every request and validated against `source_currency`.
- Missing/ambiguous denomination units are rejected with `400`.

If the effective threshold is greater than `0`, rows that do not have usable create-time threshold
snapshot values are excluded from filtered results. With an effective threshold of `0`, those rows
may still appear in unfiltered responses.

## Consumer migration notes

- Threshold query parameter is `minimumAmountMinor` (the previous USD-centric query name is not accepted).
- Threshold filtering is based on create-time root preferred-currency snapshot values:
  `threshold_currency_at_create` and `threshold_amount_minor_at_create`.
- `amount_unit` is required on standard create endpoints; ambiguous or missing denomination units are rejected.

CORS on Metaboost allows browser clients to call the API directly; **security** still depends on the
signed assertion, not on `Origin`. See [STANDARD-ENDPOINT-APP-SIGNING.md](./STANDARD-ENDPOINT-APP-SIGNING.md).

## Error handling and retries

Metaboost returns JSON with **`errorCode`** (see spec). Common codes:

| HTTP | `errorCode`            | Retry strategy                                              |
| ---- | ---------------------- | ----------------------------------------------------------- |
| 401  | `app_assertion_*`      | Fix signing, claims, or clock skew; **do not** blind retry. |
| 403  | `app_not_registered`   | Fix registry / wait for poll after merge.                   |
| 403  | `app_suspended`        | Stop; resolve with registry maintainers.                    |
| 403  | `app_registry_blocked` | Registry record is suspended/revoked; posting is denied.    |
| 403  | `app_global_blocked`   | App is blocked site-wide by server admins.                  |
| 403  | `app_bucket_blocked`   | App is blocked by bucket policy (root + descendants).       |
| 409  | `app_assertion_replay` | Use a **new** `jti`; same JWT is rejected.                  |
| 429  | `app_rate_limited`     | Back off with jitter; reduce request rate.                  |

For **`429`**, exponential backoff is appropriate. For **`409`**, mint a **new** assertion with a fresh
**`jti`**. Retrying the **same** JWT after **`app_assertion_invalid`** or binding failures will not
help until the underlying mismatch (body, path, method) is fixed.

## Security best practices

- Keep **private keys** only on servers or secure CI that need them.
- Treat **`jti`** as a **nonce**: one-time use per successful logical send.
- Align **clocks** (NTP); large skew can cause **`exp`** / **`iat`** rejection.
- Prefer **TLS** end-to-end; in production, Metaboost may reject plain HTTP on Standard Endpoint
  routes (see below).

## Troubleshooting

### Signature mismatch (`app_assertion_invalid` / `app_assertion_binding_failed`)

- **Body drift:** Any change to JSON after hashing (whitespace, key order, Unicode normalization)
  breaks `bh`. Hash the **exact** bytes sent.
- **Path drift:** `p` must match the request path exactly (no wrong prefix; query string is not part
  of `p`).
- **Wrong key:** PEM does not match the public key in the registry record for `iss`.
- **Clock:** `iat` / `exp` outside verifier tolerance.

### Replay errors (`app_assertion_replay`)

You reused **`jti`**. Generate a new UUID for each distinct submission.

### App suspended or unregistered (`app_suspended` / `app_not_registered`)

Confirm **`iss`** matches **`app_id`** in registry, PR is merged, and **`status`** is **`active`**.

### App block precedence

When clients call unsigned capability pre-checks with `app_id`:

1. `app_registry_blocked` (registry `suspended` / `revoked`)
2. `app_global_blocked` (site-wide management override)
3. `app_bucket_blocked` (bucket owner/admin blocklist at root scope)

### HTTPS enforcement failures

Outside local development, Metaboost may require HTTPS (`STANDARD_ENDPOINT_REQUIRE_HTTPS`). Ensure
clients use **`https://`**, and that reverse proxies set **`X-Forwarded-Proto`** correctly when
**`STANDARD_ENDPOINT_TRUST_PROXY`** applies. See [ENV-REFERENCE.md](../development/ENV-REFERENCE.md).

## See also

- [METABOOST-APP-INTEGRATOR-QUICKSTART.md](./METABOOST-APP-INTEGRATOR-QUICKSTART.md) — end-to-end quick start (registry, signing, client POST; platform-agnostic)
- [STANDARD-ENDPOINT-APP-SIGNING.md](./STANDARD-ENDPOINT-APP-SIGNING.md) — protocol and threat model
- [STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md](./STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md) — staged gates, compatibility matrix, smoke checks, rollback, integrator comms
- [STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md](./STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md) — post-cutover validation report template
- [STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md](./STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md) — backend copy-paste patterns and fixtures
- [METABOOST-SIGNING-DISTRIBUTION.md](./METABOOST-SIGNING-DISTRIBUTION.md) — install and releases
- Package README: [`packages/metaboost-signing/PACKAGES-METABOOST-SIGNING.md`](../../packages/metaboost-signing/PACKAGES-METABOOST-SIGNING.md)
