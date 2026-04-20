# COPY-PASTA - Standard Endpoint Signing Rollout

> **Status:** Plan set **complete.** This file lives in `.llm/plans/completed/s-endpoint-signing-rollout/` alongside `00-SUMMARY.md`, `00-EXECUTION-ORDER.md`, and the numbered plan files.

Use these prompts to execute the plan files in the correct order.

**Conventions:** Public routes are **`/v1/standard/*`**; the folder name `s-endpoint-signing-rollout` is historical only. See `00-EXECUTION-ORDER.md` for the full conventions block.

**Downstream order (after Phase 4 step 09):** Gate **10** (complete) → Podverse **12** (complete) → rollout runbook **11** (complete). Minimum semver for downstream `metaboost-signing` deps: **0.2.1** (Phase 5 completion line).

## Progress

- [x] Phase 0 - Decision Locks
- [x] Phase 1 - Step 01 Registry Repo Foundation
- [x] Phase 1 - Step 02 Registry Contributor And Ops Docs
- [x] Phase 1.5 - Podverse Seed Registration Gate
- [x] Phase 2 - Step 03 Signing Helpers Package Scaffold
- [x] Phase 2 - Step 04 Signing Helpers Package Release And Distribution
- [x] Phase 3 - Step 05 Metaboost Registry Default Config
- [x] Phase 3 - Step 06 Standard Endpoint AppAssertion Verification
- [x] Phase 3 - Step 07 HTTPS Enforcement
- [x] Phase 4 - Step 08 Developer End-To-End Guides
- [x] Phase 4 - Step 09 Consumer Integration Examples
- [x] Phase 5 - Gate 10 NPM Publish Verification
- [x] Phase 6 - Step 12 Podverse Standard Endpoint Signing Integration
- [x] Phase 7 - Step 11 Cross-Repo Rollout Validation

## Phase 0

```text
Phase 0 completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/00A-DECISION-LOCKS.md
```

## Phase 1

```text
Phase 1 step `01-registry-repo-foundation.md` completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/01-registry-repo-foundation.md
```

```text
Phase 1 step `02-registry-contributor-and-ops-docs.md` completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/02-registry-contributor-and-ops-docs.md
```

## Phase 1.5 (Required Gate)

```text
Phase 1.5 completed. Podverse app record merged in metaboost-registry: PR https://github.com/podverse/metaboost-registry/pull/2, merge commit 0c292dffae93242c6289dc43eada36d9642aa3e7 (`registry/apps/podverse.app.json` includes Podverse metadata and signing_keys[]; `validate-registry` passed on the PR).
```

## Phase 2

```text
Phase 2 step `03-signing-helpers-package-scaffold.md` completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/03-signing-helpers-package-scaffold.md — workspace package `metaboost-signing` (`packages/metaboost-signing/`) with createAssertionClaims, hashRequestBody, signAppAssertion, buildSignedRequestHeaders; jose EdDSA; vitest; README.
```

```text
Phase 2 step `04-signing-helpers-package-release-and-distribution.md` completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/04-signing-helpers-package-release-and-distribution.md — public npm metadata (`publishConfig`, `files`, `repository`, `license`, `engines`), CHANGELOG, workflow `.github/workflows/publish-metaboost-signing.yml` (tag `metaboost-signing-v*`, `NPM_TOKEN`), docs `docs/api/METABOOST-SIGNING-DISTRIBUTION.md`, package README install/runtime/stability; `STANDARD-ENDPOINT-APP-SIGNING.md` npm section.
```

## Phase 3

```text
Phase 3 step `05-metaboost-registry-default-config.md` completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/05-metaboost-registry-default-config.md — API config `STANDARD_ENDPOINT_REGISTRY_*` (default Podverse raw GitHub base), `apps/api/src/config/standardEndpointRegistry.ts`, startup validation + listen log, `infra/env/classification/base.yaml`, `docs/development/ENV-REFERENCE.md`, helpers `validateOptionalHttpOrHttpsUrl`, unit tests.
```

```text
Phase 3 step `06-metaboost-s-endpoint-appassertion-verification.md` completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/06-metaboost-s-endpoint-appassertion-verification.md — AppAssertion POST `/v1/standard/*` middleware (`requireAppAssertionForPost`), `verifyAppAssertion.ts`, `AppRegistryService` + ETag cache, Valkey replay (`ioredis`), raw JSON body capture, OpenAPI + mbrss contract tests with signed POSTs, `app-assertion-verification.test.ts`.
```

```text
Phase 3 step `07-metaboost-https-enforcement.md` completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/07-metaboost-https-enforcement.md — `STANDARD_ENDPOINT_REQUIRE_HTTPS` / `STANDARD_ENDPOINT_TRUST_PROXY`, `lib/standardEndpoint/httpsScheme.ts`, `requireHttpsForStandardEndpoints` on `/v1/standard/*`, classification + remote/local overlays, ENV-REFERENCE + REMOTE-K8S-GITOPS, OpenAPI `HttpsRequiredError`, `standard-endpoint-https-enforcement.test.ts`.
```

## Phase 4 (Parallel Allowed)

Step 08 (completed):

```text
Phase 4 step `08-developer-end-to-end-guides-helpers.md` completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/08-developer-end-to-end-guides-helpers.md — Delivered `docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md` (prerequisites, registry onboarding, helper integration, `/v1/standard/*` usage, errors/retries, security, troubleshooting); link from `docs/api/STANDARD-ENDPOINT-APP-SIGNING.md`.
```

Step 09 (completed):

```text
Phase 4 step `09-consumer-integration-examples.md` completed. Reference completed file: /Users/mitcheldowney/repos/pv/metaboost/.llm/plans/completed/s-endpoint-signing-rollout/09-consumer-integration-examples.md — `docs/api/STANDARD-ENDPOINT-CONSUMER-EXAMPLES.md`; `packages/metaboost-signing/fixtures/consumer-example-*.json`; `src/consumer-example.fixtures.test.ts`; README link; integration guide cross-link.
```

## Phase 5 - NPM publish verification gate (plan 10)

**Gate satisfied:** **`metaboost-signing` is on the public npm registry** (maintainer confirmed). To re-run verification steps only, see [10-npm-publish-verification-gate.md](./10-npm-publish-verification-gate.md).

```text
Phase 5 gate `10-npm-publish-verification-gate.md` completed. Reference completed file: .llm/plans/completed/s-endpoint-signing-rollout/10-npm-publish-verification-gate.md — Public npm: `metaboost-signing@0.2.1` verified via `npm view` (date: 2026-04-17); minimum semver for downstream repos: `0.2.1`; npm package page: https://www.npmjs.com/package/metaboost-signing
```

## Phase 6 - Podverse monorepo (plan 12)

**Completed** in the **Podverse** monorepo (`metaboost-signing` on **apps/api**, mint route, web mbrss-v1 POST + URL normalization). Reference: [12-podverse-standard-endpoint-signing-integration.md](./12-podverse-standard-endpoint-signing-integration.md).

```text
Phase 6 step `12-podverse-standard-endpoint-signing-integration.md` completed. Reference completed file: .llm/plans/completed/s-endpoint-signing-rollout/12-podverse-standard-endpoint-signing-integration.md — Podverse: `POST .../metaboost/mbrss-v1/mint-app-assertion`, `mbrssV1RequestMetadata.ts` + `reqMetaboostMbrssV1MintAppAssertion`, `normalizeMetaboostMbrssV1IngestNodeUrl`, `METABOOST_SIGNING_KEY_PEM` / `METABOOST_APP_ASSERTION_ISS` documented in apps/api ENV.
```

## Phase 7 - Integrated rollout validation (plan 11)

**Completed.** Metaboost + registry runbook and post-rollout validation report template. Podverse-specific E2E is owned by plan **12**, not **11**.

Reference: [11-cross-repo-rollout-validation.md](./11-cross-repo-rollout-validation.md).

```text
Phase 7 step `11-cross-repo-rollout-validation.md` completed. Reference completed file: .llm/plans/completed/s-endpoint-signing-rollout/11-cross-repo-rollout-validation.md — Delivered docs/api/STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md (staged gates G0–G4, compatibility matrix, smoke checklist, observability, rollback, integrator comms, phase transitions); docs/api/STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md; STANDARD-ENDPOINT-INTEGRATION-GUIDE.md See also links.
```
