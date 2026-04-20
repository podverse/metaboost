# COPY-PASTA - terms-grace-clean-slate

Use these prompts to execute one phase at a time, in order.

## Phase 1 - Schema and ORM

Status: COMPLETED (moved to `.llm/plans/completed/terms-grace-clean-slate/01-schema-and-orm.md`).

Implemented `.llm/plans/completed/terms-grace-clean-slate/01-schema-and-orm.md`.
Do not start Phase 2 until Phase 1 is complete.

## Phase 2 - Policy Evaluator and Auth API

Status: COMPLETED (moved to `.llm/plans/completed/terms-grace-clean-slate/02-policy-evaluator-and-auth-api.md`).

Implemented `.llm/plans/completed/terms-grace-clean-slate/02-policy-evaluator-and-auth-api.md`.
Use the schema/services from Phase 1 and ensure auth payloads expose terms policy fields.

## Phase 3 - Web Gating and UX

Status: COMPLETED (moved to `.llm/plans/completed/terms-grace-clean-slate/03-web-gating-and-ux.md`).

Implemented `.llm/plans/completed/terms-grace-clean-slate/03-web-gating-and-ux.md`.
Keep shared terms text parity between static and interactive pages.

## Phase 4 - Standard Endpoint Enforcement

Status: COMPLETED (moved to `.llm/plans/completed/terms-grace-clean-slate/04-standard-endpoint-enforcement.md`).

Implemented `.llm/plans/completed/terms-grace-clean-slate/04-standard-endpoint-enforcement.md`.
Enforce owner terms acceptance by policy phase and preserve deterministic error codes.

## Phase 5 - OpenAPI, Tests, and Seeds

Status: COMPLETED (moved to `.llm/plans/completed/terms-grace-clean-slate/05-openapi-tests-and-seeds.md`).

Implemented `.llm/plans/completed/terms-grace-clean-slate/05-openapi-tests-and-seeds.md`.
Finalize contracts and comprehensive API/E2E coverage.

## Phase 6 - Operations and LEGAL_NAME Env + i18n

Status: COMPLETED (moved to `.llm/plans/completed/terms-grace-clean-slate/06-operations-and-legal-name-i18n.md`).

Implemented `.llm/plans/completed/terms-grace-clean-slate/06-operations-and-legal-name-i18n.md`.
Lock the operator lifecycle workflow and ensure `LEGAL_NAME` is wired through env-overrides,
runtime config, and translated terms sentence interpolation.
