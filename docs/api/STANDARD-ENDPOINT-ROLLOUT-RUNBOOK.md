# Standard Endpoint — cross-repo rollout runbook

This runbook defines **staged gates**, **compatibility expectations**, **smoke checks**,
**observability**, **rollback**, and **integrator communications** for AppAssertion-signed
`POST` traffic to Metaboost **`/v1/standard/*`**. It applies to **Metaboost** and
**metaboost-registry**. Podverse-specific E2E is **out of scope** here (see integrator docs and
the Podverse plan set).

**Related:** [METABOOST-APP-INTEGRATOR-QUICKSTART.md](./METABOOST-APP-INTEGRATOR-QUICKSTART.md) (third-party app developers),
[STANDARD-ENDPOINT-INTEGRATION-GUIDE.md](./STANDARD-ENDPOINT-INTEGRATION-GUIDE.md),
[STANDARD-ENDPOINT-APP-SIGNING.md](./STANDARD-ENDPOINT-APP-SIGNING.md),
[STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md](./STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md).

## 1. Staged rollout gates (go / no-go)

Each gate is **binary**: either satisfied or not. Do not advance while any gate in the current
phase fails.

| Gate                                      | What must be true                                                                                                                                                                                                                                                                                                | Evidence                                                                                           |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **G0 — Phase 0 decision locks**           | Decision locks are written as concrete, approved values (env names, hard-enforce policy, route prefixes).                                                                                                                                                                                                        | Approved `00A-DECISION-LOCKS` (or successor) in the plan set; no open disputes on verifier policy. |
| **G1 — Registry readiness**               | Schema and contributor docs are complete; **`validate-registry`** is a **required** GitHub Actions check on `metaboost-registry` PRs and is green on main.                                                                                                                                                       | Screenshot or CI URL; contributor can run validation locally per registry docs.                    |
| **G2 — Signing helpers on public npm**    | Consumers may depend on **`metaboost-signing`** from the **public** registry; version is pinned in runbooks (see plan **10** / COPY-PASTA minimum semver, e.g. **0.2.1**).                                                                                                                                       | `npm view metaboost-signing version` from a clean environment; npmjs.com page reachable.           |
| **G3 — Metaboost verification readiness** | Standard Endpoint `POST` requests require a valid AppAssertion where enforcement is enabled; verifier, registry poll, replay store, and HTTPS policy behave per [ENV-REFERENCE.md](../development/ENV-REFERENCE.md).                                                                                             | Integration tests green; staging smoke (section 3) passes.                                         |
| **G4 — Developer docs and examples**      | [METABOOST-APP-INTEGRATOR-QUICKSTART.md](./METABOOST-APP-INTEGRATOR-QUICKSTART.md), [STANDARD-ENDPOINT-INTEGRATION-GUIDE.md](./STANDARD-ENDPOINT-INTEGRATION-GUIDE.md), and [STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md](./STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md) are current and linked from the app-signing spec. | Doc review checklist complete.                                                                     |

**Ordering:** Gate **G2** (npm) must pass **before** downstream repos add a production dependency on
`metaboost-signing`. Gate **G1** must pass **before** relying on registry keys in production.

## 2. Compatibility matrix

Use this matrix in **non-production** first; record results in the [post-rollout validation report template](./STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md).

| Scenario                                       | Expected behavior (binary)                                                                                                                                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Signed request required**                    | Unsigned `POST` to protected `/v1/standard/*` routes receives **401** with an `app_assertion_*` style `errorCode` (see OpenAPI / spec).                                                                          |
| **Invalid or malformed signature**             | **401** with `errorCode` such as `app_assertion_invalid` (not accepted as success).                                                                                                                              |
| **Binding mismatch** (wrong `bh`, `p`, or `m`) | **401** / binding failure per spec (`app_assertion_binding_failed` or equivalent documented code).                                                                                                               |
| **Replay** (duplicate `jti`)                   | **409** with `app_assertion_replay` when prior success consumed the nonce.                                                                                                                                       |
| **App record missing**                         | **403** with `app_not_registered` until registry is merged and Metaboost has polled.                                                                                                                             |
| **App suspended**                              | **403** with `app_suspended`; no successful write.                                                                                                                                                               |
| **HTTPS vs insecure (non-local)**              | When `STANDARD_ENDPOINT_REQUIRE_HTTPS` is enabled for the environment, plain **http** `POST` to `/v1/standard/*` is **rejected** (documented HTTPS error); **https** succeeds when assertion and body are valid. |
| **Local dev**                                  | HTTPS requirement may be relaxed per env template; behavior matches [ENV-REFERENCE.md](../development/ENV-REFERENCE.md).                                                                                         |

## 3. End-to-end smoke checklist (non-production)

Dry-run this checklist **end-to-end** at least once **before** production cutover. Each step is **pass/fail**.

1. **Register app** — Open a PR in `metaboost-registry` adding/updating `registry/apps/<app_id>.app.json` with `signing_keys[]`; **`validate-registry`** passes; PR merged.
2. **Integrate helpers** — In a **sample backend** (or CI job), `npm install metaboost-signing@<minimum semver>` per gate **G2**; load Ed25519 PKCS#8 PEM from a secret; no key in repo.
3. **Sign and POST** — Build the **exact** JSON body bytes; compute `bh`; mint JWT with `createAssertionClaims` + `signAppAssertion`; send `POST` to a real **`/v1/standard/...`** route with `Authorization: AppAssertion <jwt>` and `Content-Type: application/json`.
4. **Confirm success** — Response is **2xx** where applicable; downstream effect matches product expectation (e.g. message accepted / stored per route contract).
5. **Negative checks** — Repeat with unsigned POST (expect **401**), wrong body after sign (expect **401** binding/invalid), and replayed `jti` (expect **409**).

References: [STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md](./STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md), package fixtures under `packages/metaboost-signing/fixtures/`.

## 4. Observability checks

| Check                     | What to look for                                                                                                   | Rollout threshold (tune per environment)                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| **Request logs**          | Structured fields for **`iss`** (app id), **`errorCode`** (if any), allow/deny decision.                           | Able to filter by app id for a 15-minute window.                                                                        |
| **Auth failure rate**     | Count of **401**/`app_assertion_*` on `/v1/standard/*` vs total `POST`.                                            | Spike investigation if failure rate jumps **above baseline** after a deploy (no universal % — document baseline first). |
| **Registry fetch health** | Metaboost registry client: successful fetch, ETag/cache behavior, **no sustained** fetch failures.                 | Alert if registry refresh fails continuously for **> N minutes** (define N per ops).                                    |
| **Replay / Valkey**       | No unexpected **409** storm from a single app (possible bug); elevated **409** may indicate client reuse of `jti`. | Compare to traffic volume.                                                                                              |

## 5. Rollback strategy

Validate **rollback steps once in non-production** before production cutover (table below).

| Layer                    | Rollback action                                                                                                                                                                                                                                                                                                           | When to use                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Configuration**        | Revert or toggle Metaboost env (e.g. HTTPS requirement, trust proxy) via GitOps / deployment; redeploy previous **ConfigMap**/**Secret** generation.                                                                                                                                                                      | Mis-issued TLS / proxy headers causing mass HTTPS rejects. |
| **Helper package**       | Pin **`metaboost-signing`** to last known good semver in consumer `package.json`; redeploy consumer.                                                                                                                                                                                                                      | Regression in published package.                           |
| **Verifier enforcement** | If the deployment supports relaxing Standard Endpoint assertion requirements **without** shipping unsafe defaults, use the **documented** ops path only. **Default policy is hard-enforce** for signed routes; there may be **no** “unsigned fallback” in production — confirm in release notes and code before assuming. | Catastrophic verifier bug; coordinate with maintainers.    |
| **Registry**             | Revert a **bad registry PR** via new PR (restore keys/status); Metaboost will pick up on poll.                                                                                                                                                                                                                            | Wrong key or accidental suspension.                        |

## 6. Release communication checklist (integrators)

Send or publish **before** production enforcement windows:

- [ ] **Minimum `metaboost-signing` semver** (from gate **10** / COPY-PASTA).
- [ ] **Registry is mandatory** for registered `app_id`; link to **ONBOARDING** / **SCHEMA** in `metaboost-registry`.
- [ ] **Breaking behaviors:** unsigned `POST` rejected where enforced; exact `errorCode` values and HTTP statuses (point to integration guide table).
- [ ] **HTTPS** expectation for non-local deployments (`STANDARD_ENDPOINT_REQUIRE_HTTPS`).
- [ ] **Support channel** and timeline for suspension / key rotation.

## 7. Phase transition completion checks

Use this table when moving between implementation phases of the rollout plan set.

| Transition                       | Completion criteria (binary)                                                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 0 → 1**                  | Decision locks are concrete and approved.                                                                                                                                                |
| **Phase 1 → 2**                  | Registry schema and contributor docs complete; **`validate-registry`** required on PRs and verified working.                                                                             |
| **Phase 2 → 3**                  | Helper package API surface and distribution workflow complete (see plan **04** / **10**).                                                                                                |
| **Phase 3 → 4**                  | Verifier behavior, defaults, and HTTPS enforcement complete (plans **06**, **07**).                                                                                                      |
| **Phase 4 → 5**                  | Onboarding docs and consumer examples complete (plans **08**, **09**).                                                                                                                   |
| **Phase 5 → Production cutover** | This runbook and the [post-rollout validation report template](./STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md) are complete; smoke and rollback drills done in non-prod. |

## 8. Verification (plan exit criteria)

- [ ] Dry-run checklist (section 3) executed **end-to-end** in a non-production environment.
- [ ] Each phase has **clear go/no-go** criteria (sections 1 and 7).
- [ ] Rollback steps (section 5) **exercised at least once** before production cutover.
- [ ] Phase transitions include **explicit completion confirmation** in the plan set (COPY-PASTA / execution order).
- [ ] Registry PRs remain **blocked** when **`validate-registry`** fails and **unblocked** when it passes.
