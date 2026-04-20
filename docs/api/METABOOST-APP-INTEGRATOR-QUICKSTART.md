# Metaboost app integration — developer quick start

**Audience:** Engineers building **client apps** that send signed `POST` requests **to** an existing Metaboost deployment. **Not** for people who operate or deploy Metaboost servers.

---

## 1. What you are building

Metaboost accepts writes on **`POST /v1/standard/*`** when the request carries a short-lived **AppAssertion** JWT proving that a **registered app** (`app_id`) authorized that exact body and path. Your **private signing key** stays on your servers (or a service you control). The **browser or app** only needs the JWT and the **same JSON bytes** you hashed—not the private key.

---

## 2. Register your app (public keys)

Metaboost reads **public keys** from **[metaboost-registry](https://github.com/v4v-io/metaboost-registry)**.

1. **Fork** [metaboost-registry](https://github.com/v4v-io/metaboost-registry) on GitHub, then follow [FIRST-APP-SUBMISSION.md](https://github.com/v4v-io/metaboost-registry/blob/main/docs/FIRST-APP-SUBMISSION.md) to set up and run the **registry script** (e.g. `./scripts/registry-app`) from your fork.
2. Add your app’s information and **public** signing keys (keep the private key out of git).
3. Open a **pull request** and merge once CI **`validate-registry`** passes.

After merge, the Metaboost instance you call may need a short time to pick up the registry; until then you can see **`app_not_registered`**.

---

## 3. Signing contract (platform-agnostic)

You may implement signing in **any language**. You must produce a JWT that satisfies Metaboost’s verifier.

**Transport (every request)**

| Piece  | Value                                                        |
| ------ | ------------------------------------------------------------ |
| Method | `POST`                                                       |
| Header | `Authorization: AppAssertion <jwt>`                          |
| Header | `Content-Type: application/json`                             |
| Body   | Raw JSON bytes — **exactly** what you hashed into claim `bh` |

**JWT header**

| Field | Value             |
| ----- | ----------------- |
| `alg` | `EdDSA` (Ed25519) |
| `typ` | `JWT`             |

**JWT claims (required)**

| Claim | Meaning                                                                                    |
| ----- | ------------------------------------------------------------------------------------------ |
| `iss` | Your registered **`app_id`**.                                                              |
| `iat` | Issued-at (Unix seconds).                                                                  |
| `exp` | Expiry (Unix seconds). **`exp - iat`** must not exceed **300** seconds (max TTL).          |
| `jti` | Unique id per logical send (UUID v4 recommended). Reuse causes **`app_assertion_replay`**. |
| `m`   | `"POST"`.                                                                                  |
| `p`   | **Exact** URL path (starts with `/v1/standard/...`), **no query string**.                  |
| `bh`  | **Lowercase hex** SHA-256 of the **raw request body bytes**.                               |

**Binding:** Metaboost recomputes SHA-256 of the body and compares to `bh`; compares path to `p`; compares method to `m`. Any mismatch → failure (often **`app_assertion_binding_failed`** / **`app_assertion_invalid`**).

---

## 4. Optional path A — Reference npm package (`metaboost-signing`)

If you use **Node.js** (or a JS toolchain that can use npm packages), you can use the published helper **`metaboost-signing`** instead of reimplementing the claim layout and hashing.

1. Install: `npm install metaboost-signing`  
   Semver and releases: [METABOOST-SIGNING-DISTRIBUTION.md](./METABOOST-SIGNING-DISTRIBUTION.md).
2. Load your **private key PEM** only on the server (env/secret manager).
3. For each request: serialize body to bytes → `hashRequestBody` → `createAssertionClaims` → `signAppAssertion` → `buildSignedRequestHeaders` → send `POST` with those headers and the **same** body buffer.

Minimal pattern (same idea as [STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md](./STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md)):

```typescript
import {
  buildSignedRequestHeaders,
  createAssertionClaims,
  hashRequestBody,
  signAppAssertion,
} from 'metaboost-signing';

const path = '/v1/standard/mbrss-v1/boost/yourBucketId';
const body = Buffer.from(JSON.stringify({ /* …payload… */ }), 'utf8');
const bh = hashRequestBody(body);
const iat = Math.floor(Date.now() / 1000);
const jwt = await signAppAssertion({
  claims: createAssertionClaims({
    iss: 'your-app-id',
    iat,
    exp: iat + 120,
    jti: crypto.randomUUID(),
    m: 'POST',
    p: path,
    bh,
  }),
  privateKeyPem: process.env.METABOOST_SIGNING_KEY_PEM!,
});
const { Authorization } = buildSignedRequestHeaders({ jwt });
// POST to your known URL (path must equal `path` above) with Authorization, Content-Type: application/json, body
```

More examples: [STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md](./STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md).

---

## 5. Optional path B — Non-Node or custom stack

You do **not** have to use Node or npm.

1. **Implement the same contract** (Section 3): Ed25519-signed JWT with the listed header and claims; `bh` from SHA-256 of raw body bytes.
2. **Or** run a **small internal signing service** (any language) that accepts the canonical body (and path / `iss`) from your main backend and returns `Authorization: AppAssertion <jwt>`; your main app never holds the PEM if you prefer that topology.
3. **Never** send the **private key** to a browser, mobile app, or untrusted client.

---

## 6. Backend ↔ client handoff (recommended for web and mobile)

To avoid exposing the private key:

1. Client prepares the **final** JSON payload (the exact structure you will POST to Metaboost).
2. Client calls **your backend** (or signing service): “sign this body for path `p`.”
3. Backend computes `bh`, mints JWT, returns **`Authorization`** (or full header set) and ideally the **same serialized body bytes** (or a strict contract: client must not change serialization after signing).
4. Client sends **`POST`** to **the same URL** you signed for (path must match claim `p`) with `Authorization`, `Content-Type: application/json`, and **those exact body bytes**.

If the client mutates JSON after signing (whitespace, key order, Unicode), **`bh`** no longer matches → request fails.

---

## 7. Send the HTTP request

1. **URL:** Use the **full POST URL** your app targets. Claim **`p`** must equal that URL’s **path** (query string is **not** part of `p` unless your route contract says otherwise; confirm against the endpoint you call).
2. **Method:** `POST`.
3. **Headers:** `Authorization: AppAssertion <jwt>`, `Content-Type: application/json`.
4. **Body:** Byte-identical to what was hashed.

**Browsers:** Metaboost is typically **CORS-permissive** for these routes; do not rely on `Origin` for security. The JWT is the access control.

---

## 8. Success and common errors

**Success:** HTTP **2xx** per route; response shape depends on the endpoint.

**Failures:** JSON body often includes **`errorCode`**. Typical cases:

| HTTP | `errorCode` (examples)                            | What to do                                                                                    |
| ---- | ------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 401  | `app_assertion_*`, `app_assertion_binding_failed` | Fix signing, path `p`, body bytes `bh`, or clock skew. Do **not** blindly retry the same JWT. |
| 403  | `app_not_registered`                              | Registry PR merged? Wait for Metaboost registry poll.                                         |
| 403  | `app_suspended`                                   | Stop; resolve with registry operators.                                                        |
| 409  | `app_assertion_replay`                            | Mint new JWT with **new** `jti`.                                                              |
| 429  | `app_rate_limited`                                | Back off with jitter; reduce rate.                                                            |

Full list and semantics: [STANDARD-ENDPOINT-APP-SIGNING.md](./STANDARD-ENDPOINT-APP-SIGNING.md).

---

## 9. Checklist before production

- [ ] **`app_id`** in JWT `iss` matches registry; app **`active`**.
- [ ] **Public key** in registry matches **private key** used for signing.
- [ ] **HTTPS** when posting to HTTPS endpoints; clock sync (NTP) on signers.
- [ ] **`p`** equals the request path; **`m`** is `POST`; **`bh`** matches SHA-256 of body.
- [ ] **New `jti`** for each distinct submission (no reuse after success).
- [ ] **`exp - iat` ≤ 300** seconds.

---

## Related docs

| Doc                                                                                | Use when                                             |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [STANDARD-ENDPOINT-APP-SIGNING.md](./STANDARD-ENDPOINT-APP-SIGNING.md)             | Full protocol, threat model, error codes.            |
| [STANDARD-ENDPOINT-INTEGRATION-GUIDE.md](./STANDARD-ENDPOINT-INTEGRATION-GUIDE.md) | Deeper npm onboarding, troubleshooting, HTTPS notes. |
| [STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md](./STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md) | More `metaboost-signing` code patterns.              |
| [METABOOST-SIGNING-DISTRIBUTION.md](./METABOOST-SIGNING-DISTRIBUTION.md)           | Package install and releases.                        |
| [STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md](./STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md)     | Rollout gates and org-level validation (optional).   |
