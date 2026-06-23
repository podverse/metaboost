# COPY-PASTA — membership rename

Execute prompts in order. Mark `[x]` when complete. Move completed numbered files to `.llm/plans/completed/membership-rename/` per plan-execution-completion-tracking.

---

## Phase 1 — Schema

- [x] **Prompt 1** — Implement [01-schema-migrations.md](01-schema-migrations.md): replace `0003`/`0004` migration files, update kustomization, regenerate `0003a` baseline.

---

## Phase 2 — ORM entity

- [x] **Prompt 2** — Implement [02-orm-entity-and-relations.md](02-orm-entity-and-relations.md): `UserMembership` entity, `User.membership`, exports.

---

## Phase 3 — ORM services

- [x] **Prompt 3** — Implement [03-orm-services.md](03-orm-services.md): `UserService.upsertMembership`, renewal orchestrator, period extension.

---

## Phase 4 — API and management-api

- [x] **Prompt 4** — Implement [04-api-and-management-usages.md](04-api-and-management-usages.md): requireAuth, billing, management users, integration tests.

---

## Phase 5 — Seed and E2E

- [x] **Prompt 5** — Implement [05-seed-and-e2e-tooling.md](05-seed-and-e2e-tooling.md): `0008` local user membership seed, `tools/web/seed-e2e.mjs`.

---

## Cumulative verification (operator)

```bash
npm run build:packages
npm run lint
npm run test:unit
npm run test:e2e:api
make e2e_test_web_report_spec SPEC=e2e/auth-stale-cookies-redirect-login.spec.ts
```

For local dev login after rename:

```bash
make local_db_init
```

Or apply the one-off in [05-seed-and-e2e-tooling.md](05-seed-and-e2e-tooling.md), then restart `npm run dev:all:watch`.
