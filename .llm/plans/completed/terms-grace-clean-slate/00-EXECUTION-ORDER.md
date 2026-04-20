# Execution Order

1. **Phase 1 - Schema and ORM** (`01-schema-and-orm.md`)
   - Must land first. All downstream API/web logic depends on these tables/services.
2. **Phase 2 - Policy evaluator and auth API** (`02-policy-evaluator-and-auth-api.md`)
   - Depends on Phase 1.
3. **Phase 3 - Web gating and terms UX** (`03-web-gating-and-ux.md`)
   - Depends on Phase 2 auth payload shape and policy fields.
4. **Phase 4 - Standard endpoint enforcement** (`04-standard-endpoint-enforcement.md`)
   - Depends on Phases 1-2 policy services.
5. **Phase 5 - Contracts, tests, and seeds** (`05-openapi-tests-and-seeds.md`)
   - Depends on Phases 2-4 being stable.
6. **Phase 6 - Operations and LEGAL_NAME env/i18n wiring** (`06-operations-and-legal-name-i18n.md`)
   - Depends on Phases 1-5 definitions so operational workflows and UI copy match final contracts.

## Parallelization Rules

- Run phases sequentially.
- Within Phase 5, API integration tests and web E2E updates can be developed in parallel, then
  reconciled in one pass before completion.
