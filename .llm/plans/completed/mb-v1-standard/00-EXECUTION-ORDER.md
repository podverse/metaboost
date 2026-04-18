# Execution order

1. **Phase 1 — Schema & ORM** (`01-schema-migrations-orm.md`): Run before API.
2. **Phase 2 — mb-v1 API + refactor** (`02-api-standard-mb-v1-and-refactor.md`): Depends on Phase 1.
3. **Phase 3 — Bucket create policy** (`03-buckets-child-create-and-policy.md`): Depends on Phase 1; can follow Phase 2 in parallel only if branches coordinated—prefer sequential after Phase 2.
4. **Phase 4 — Web** (`04-web-ui-endpoint-tab.md`): After Phase 3 API is stable.
5. **Phase 5 — Tests** (`05-tests-e2e-management.md`): After Phases 2–4.
6. **Phase 6 — Podverse** (`06-podverse-v4v-metaboost.md`): Can follow Phase 2+ for types; full verification after Metaboost tests pass.
