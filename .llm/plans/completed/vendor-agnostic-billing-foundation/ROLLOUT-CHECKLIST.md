# Rollout checklist — Vendor-agnostic billing foundation (Metaboost)

Use before enabling billing features in a new environment or after merging the full plan set.

## Phase contract traceability

| Phase | Topic | Outcome |
| --- | --- | --- |
| 01 | Domain and period policy | Completed — see `completed/01-domain-and-period-policy.md` |
| 02 | Pricing catalog and schema | Linear SQL + catalog tables |
| 03 | Services, API, orchestration | ORM services, main API, CLI renewals |
| 04 | Membership settings bootstrap | `product_membership_settings` + env alignment |
| 05 | Management pricing governance | Management API + `/products/membership` UI |
| 06 | Public API billing read models | `GET /product/membership`, `GET /auth/billing/membership-summary` |
| 07 | Tests and rollout verification | This checklist + integration/E2E acceptance |

## Database and migrations

- [ ] Linear app/management migrations applied in **numeric order**; no manual skips.
- [ ] `make db_regen_linear_baseline` (or repo equivalent) run if linear SQL under `linear-migrations/` changed, and committed baseline artifacts updated.
- [ ] Test DBs (`make test_deps`) come up clean for `npm run test:e2e:api` and management-api tests.

## Bootstrap and idempotency

- [ ] `BillingPriceCatalogService` / product membership resolution can run repeatedly without duplicate open price windows (unique constraints + `resolveProductMembership` idempotent seeding).
- [ ] `MembershipPeriodExtensionService` dedupes on `lastExtensionIdempotencyKey` (covered by `membership-period-extension.test.ts`).
- [ ] Renewal job / `process-due-renewals` safe to re-run; stub or real adapter honors idempotency keys.

## Permissions and management API

- [ ] `admin_permissions.billing_prices_crud` present; roles that need pricing UI include read (and create/update for mutators).
- [ ] Super-admins bypass; non–super-admins without billing read get **403** on `/billing-prices*`, `/product/membership`, and schedule/deprecate (covered by `billing-prices.test.ts`).

## Application verification (local/CI)

- [ ] `npm run lint` (repo root) passes.
- [ ] `npm run test:e2e:api` passes (Postgres + Valkey test ports; `make test_deps` if needed).
- [ ] Management-web E2E: `make e2e_test_management_web_report_spec SPEC=e2e/products-membership-billing.spec.ts` (and dashboard link spec if nav changed).

## Non-goals (confirm unchanged)

- [ ] No feed/parser/lifecycle or object-storage work bundled with this billing rollout.
- [ ] No broad management-web refactors outside billing-adjacent routes and i18n keys for this feature set.

## GitOps (if K8s env templates changed in a release)

- [ ] Push the GitOps branch your Argo CD instance tracks (e.g. `develop`) so the cluster can sync new env and migration markers.
