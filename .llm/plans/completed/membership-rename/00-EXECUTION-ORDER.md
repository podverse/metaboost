# Execution order — membership rename

Phases are **sequential**. Do not start the next phase until the previous phase is complete and verified.

## Phase 1 — Schema (blocking)

- [01-schema-migrations.md](01-schema-migrations.md)

## Phase 2 — ORM entity and relations

- [02-orm-entity-and-relations.md](02-orm-entity-and-relations.md)

Depends on Phase 1 (table name in `@Entity`).

## Phase 3 — ORM services

- [03-orm-services.md](03-orm-services.md)

Depends on Phase 2 (`UserMembership` entity and `User.membership`).

## Phase 4 — API and management-api

- [04-api-and-management-usages.md](04-api-and-management-usages.md)

Depends on Phase 3 (`upsertMembership`, relation name).

## Phase 5 — Seed and E2E tooling

- [05-seed-and-e2e-tooling.md](05-seed-and-e2e-tooling.md)

Depends on Phase 1 (`user_membership` table exists in schema).

## After all phases

Operator verification (cumulative):

```bash
npm run build:packages
npm run lint
npm run test:unit
npm run test:e2e:api
make e2e_test_web_report_spec SPEC=e2e/auth-stale-cookies-redirect-login.spec.ts
```

For existing local Docker DB (table rename without full re-init), re-run `make local_db_init` or apply the one-off in [05-seed-and-e2e-tooling.md](05-seed-and-e2e-tooling.md).
