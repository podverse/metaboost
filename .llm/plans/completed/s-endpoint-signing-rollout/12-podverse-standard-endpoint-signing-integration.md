# 12 - Podverse Monorepo — Standard Endpoint AppAssertion (mbrss-v1)

> **Status:** **Completed** (Podverse monorepo). See completion note at end.

## Scope

Integrate **signed `POST`** requests to Metaboost **`/v1/standard/*`** mbrss-v1 routes from the **Podverse**
monorepo, using the published **`metaboost-signing`** npm package and the same AppAssertion
contract as [STANDARD-ENDPOINT-APP-SIGNING.md](../../../../docs/api/STANDARD-ENDPOINT-APP-SIGNING.md).

## Hard dependency

- **Prerequisite:** [10-npm-publish-verification-gate.md](./10-npm-publish-verification-gate.md) is **complete**; COPY-PASTA records a **minimum published semver** for `metaboost-signing` (**0.2.1**).
- Podverse `package.json` (or workspace) must depend on **`metaboost-signing@^X.Y.Z`** at or above that minimum — **not** a `file:` path to the Metaboost monorepo for production builds.

## Architecture (non-negotiable)

- **Private signing keys** stay on a **trusted server** only. The browser may perform the **final**
  `POST` to Metaboost with `Authorization: AppAssertion <jwt>`, but the JWT must be **minted** where
  the PEM lives (see [STANDARD-ENDPOINT-APP-SIGNING.md](../../../../docs/api/STANDARD-ENDPOINT-APP-SIGNING.md) “Signing placement”).
- Request body bytes used for claim **`bh`** must be **identical** to the bytes sent in the `POST`
  (hash the exact JSON serialized for the wire).

## Outcomes

- Podverse sends **`Authorization: AppAssertion <jwt>`** on mbrss-v1 boost POSTs to Metaboost.
- Signing key is loaded only in server-side code (Podverse API, Next.js server route, or equivalent —
  not bundled to the client).
- Tests cover signing contract or integration points per Podverse testing policy.

## Steps

1. **Add dependency** on `metaboost-signing` (semver from gate **10**) in the appropriate
   Podverse workspace (likely `apps/api` and/or `apps/web` depending on where mint runs).
2. **Mint endpoint:** implement a server-only route that:
   - accepts (or derives) the canonical JSON body and target path **`p`** (`/v1/standard/mbrss-v1/...`);
   - uses `hashRequestBody`, `createAssertionClaims`, `signAppAssertion`, `buildSignedRequestHeaders`;
   - returns the JWT (or full headers) to the caller that will issue the Metaboost `POST`.
3. **Client path:** update the web flow that currently POSTs metadata to Metaboost without signing
   (see suggested files) to attach **`Authorization`** and send the **same** body bytes used when
   hashing.
4. **Env / secrets:** document `METABOOST_SIGNING_KEY_PEM` (or Podverse naming convention) in env
   templates; never expose in client bundles.
5. **URL normalization:** ensure `metaBoost.node` / ingest URLs resolve to **`/v1/standard/mbrss-v1/...`**
   (update helpers if tests still expect legacy `/v1/s/` shapes).
6. **Tests:** unit tests for signing helpers usage; E2E or integration as required by
   Podverse testing policy if applicable.

## Suggested file targets (Podverse)

- [`podverse/apps/web/src/components/Boost/payments/mbrssV1/mbrssV1RequestMetadata.ts`](https://github.com/podverse/podverse/blob/develop/apps/web/src/components/Boost/payments/mbrssV1/mbrssV1RequestMetadata.ts) — attach signed headers to Metaboost `POST`.
- [`podverse/apps/web/src/components/Boost/hooks/useBoostPayments.ts`](https://github.com/podverse/podverse/blob/develop/apps/web/src/components/Boost/hooks/useBoostPayments.ts) — flow that triggers mbrss post.
- [`podverse/packages/v4v-metaboost/`](https://github.com/podverse/podverse/tree/develop/packages/v4v-metaboost) — URL normalization / `metaBoostStandard` if paths still assume `/v1/s/`.
- **New or existing server route** under [`podverse/apps/api/`](https://github.com/podverse/podverse/tree/develop/apps/api) — **mint** AppAssertion for a given body + path.

Cross-reference implementation details with [STANDARD-ENDPOINT-INTEGRATION-GUIDE.md](../../../../docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md).

## Verification

- Unsigned `POST` to Metaboost mbrss-v1 ingest is rejected when verification is enforced; Podverse path succeeds with valid assertion.
- `p` claim matches the request path; `bh` matches raw JSON body.

## Implementation Notes

- Rollout validation runbook (**plan 11**) stays Metaboost-focused; **this plan** owns Podverse E2E proof.
- Keep scope limited to mbrss-v1 boost POST path; extend later for other `/v1/standard/*` routes if needed.

---

## Completion (Podverse repo)

- **`metaboost-signing`** dependency on **`apps/api`** (`^0.2.1`).
- **Mint:** `POST /api/v2/metaboost/mbrss-v1/mint-app-assertion` (auth + rate limit), uses `METABOOST_SIGNING_KEY_PEM` / optional `METABOOST_APP_ASSERTION_ISS`; returns `{ authorization, ingest_url }`.
- **Web:** `mbrssV1RequestMetadata.ts` — canonical `bodyJson`, mint via `reqMetaboostMbrssV1MintAppAssertion`, then Metaboost POST with same string body + `Authorization`.
- **`v4v-metaboost`:** `normalizeMetaboostMbrssV1IngestNodeUrl` (`/v1/s/` → `/v1/standard/`), used by capability GET and boost POST; unit tests in `mbrssV1IngestUrl.test.ts`.
- **Docs:** `apps/api/.env.example`, `apps/api/ENV.md` for MetaBoost env vars.
- **`helpers-requests`:** `reqMetaboostMbrssV1MintAppAssertion` on `ApiRequestService`.
