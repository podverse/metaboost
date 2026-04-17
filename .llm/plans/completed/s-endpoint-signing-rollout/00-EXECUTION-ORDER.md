# Standard Endpoint Signing Rollout - Execution Order

> **Status:** Plan set **complete.** Location: `.llm/plans/completed/s-endpoint-signing-rollout/`.

## How To Execute

- Phases are sequential; do not start the next phase until the current phase is complete.
- Within a phase, run files in listed order unless a parallel group is explicitly defined.
- Verify outputs for each file before moving forward.

## Conventions

- This plan set’s directory name (`s-endpoint-signing-rollout`) is historical. **Public Metaboost routes** for this rollout are **`/v1/standard/*`** (not `/v1/s/*`). Env keys use the **`STANDARD_ENDPOINT_*`** prefix.

## Phase 0 - Decision Locks

1. `00A-DECISION-LOCKS.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)

Exit criteria:

- All eight decision locks are explicitly approved.
- Env names/defaults are frozen.
- First-version enforcement policy is hard-enforce only.

## Phase 1 - Registry Contract And Documentation

1. `01-registry-repo-foundation.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)
2. `02-registry-contributor-and-ops-docs.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)

Exit criteria:

- `metaboost-registry` has a stable structure, schema, and basic examples.
- Third-party app registration and key-management docs are publish-ready.

## Phase 1.5 - Podverse Seed Registration (Required Gate)

Required action before Phase 2:

- Submit and merge the first Podverse app registry record PR in `metaboost-registry` with:
  - Podverse app metadata (`app_id`, `display_name`, `owner`, `status`, timestamps);
  - first public key entry in `signing_keys[]`.
- Confirm required CI check `validate-registry` passes on that PR.

Exit criteria:

- Podverse seed registry PR is merged.
- `validate-registry` passed on the merged PR.

## Phase 2 - Signing Helpers Package

1. `03-signing-helpers-package-scaffold.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)
2. `04-signing-helpers-package-release-and-distribution.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)

Exit criteria:

- Signing helpers package design and API surface are concrete and testable.
- Package publish/version/distribution workflow is defined for external integrators.

## Phase 3 - Metaboost Core Security Behavior

1. `05-metaboost-registry-default-config.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)
2. `06-metaboost-s-endpoint-appassertion-verification.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)
3. `07-metaboost-https-enforcement.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)

Exit criteria:

- Metaboost defaults to Podverse registry with env override support.
- Standard Endpoint signing verification behavior is specified end-to-end.
- HTTPS enforcement outside local development is unambiguous.

## Phase 4 - Developer Journey And Consumer Integration

Parallel group A (can run together after Phase 3):

- `08-developer-end-to-end-guides-helpers.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)
- `09-consumer-integration-examples.md` (completed; moved to `.llm/plans/completed/s-endpoint-signing-rollout/`)

Exit criteria:

- Developer onboarding flow is complete from registration to signed request usage with helpers.
- Framework-agnostic consumer integration examples are complete and validated.

## Phase 5 - NPM Publish Verification Gate

1. `10-npm-publish-verification-gate.md` (completed — see [`./10-npm-publish-verification-gate.md`](./10-npm-publish-verification-gate.md))

Exit criteria:

- `metaboost-signing` resolves from the **public** npm registry (`npm view`).
- Minimum published **semver** for downstream consumers is recorded in COPY-PASTA.

**Status:** Satisfied (minimum semver **0.2.1**, 2026-04-17; see COPY-PASTA Phase 5).

**Sequential rule:** Phase 6 may proceed; Phase 5 exit criteria are met.

## Phase 6 - Podverse Monorepo (Standard Endpoint Signing)

1. `12-podverse-standard-endpoint-signing-integration.md` (completed — [`./12-podverse-standard-endpoint-signing-integration.md`](./12-podverse-standard-endpoint-signing-integration.md))

Exit criteria:

- Podverse sends signed `POST` requests to Metaboost `/v1/standard/*` mbrss-v1 routes per spec.
- Private key remains server-side; `metaboost-signing` dependency uses published semver from Phase 5.

**Status:** Satisfied (Podverse implementation merged per plan **12** completion block).

## Phase 7 - Integrated Rollout Validation (Metaboost + Registry)

1. `11-cross-repo-rollout-validation.md` (completed — [`./11-cross-repo-rollout-validation.md`](./11-cross-repo-rollout-validation.md))

**Ordering note:** Run after Phase 4 step **09** and gate **10**; typically after Phase **6** so the runbook can reference completed consumer work. Podverse validation is **not** duplicated here — see plan **12**.

Exit criteria:

- Cross-repo rollout, smoke testing, rollback, and cutover steps are implementation-ready for Metaboost and registry.

**Status:** Satisfied — [STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md](../../../../docs/api/STANDARD-ENDPOINT-ROLLOUT-RUNBOOK.md) and [STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md](../../../../docs/api/STANDARD-ENDPOINT-POST-ROLLOUT-VALIDATION-REPORT-TEMPLATE.md) delivered.

## Handoff Notes

- Keep all changes documented in LLM history during implementation execution.
