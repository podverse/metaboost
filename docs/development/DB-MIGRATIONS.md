# Database Migrations (Forward-Only)

Metaboost uses forward-only SQL migrations with one canonical source tree:

- app migrations: `infra/k8s/base/ops/source/database/linear-migrations/app`
- management migrations: `infra/k8s/base/ops/source/database/linear-migrations/management`
- bootstrap-only scripts (DB/users/grants): `infra/k8s/base/db/source/bootstrap`

## First-run contract (brand-new DB)

1. Bring up Postgres on an **empty** volume so **`docker-entrypoint-initdb.d`** runs (order:
   **`0001`** → **`0002`** → **`0003_apply_linear_baselines.sh`** + generated **`0003a`** / **`0003b`**).
2. Wait for DB readiness.
3. Trigger app and management migration jobs (typically **no-op** when checksums match the seeded
   **`linear_migration_history`**; required after deploy when new **`NNNN_*.sql`** files land).
4. Create or update the management superuser.
5. Verify all steps complete before app workload rollout.

There is no existing-DB baseline onboarding flow in this model.

## Create a migration

Create the next ordered file:

- app: `infra/k8s/base/ops/source/database/linear-migrations/app/NNNN_description.sql`
- management: `infra/k8s/base/ops/source/database/linear-migrations/management/NNNN_description.sql`

Rules:

- Prefix must be four digits.
- Filename format must be `^[0-9]{4}_[a-z0-9_]+\.sql$`.
- Previously applied files are immutable.

## Validate

```bash
npm run db:validate:linear
```

Optional DB checksum validation:

```bash
npm run db:validate:linear:db
```

Verify generated baseline artifacts are up to date:

```bash
bash scripts/database/verify-linear-baseline.sh
```

## Run locally

```bash
npm run db:migrate:linear:app
npm run db:migrate:linear:management
npm run management:superuser:create -- --random-password
```

Bootstrap scripts in `docker-entrypoint-initdb.d` run only when Postgres initializes an empty `PGDATA` volume; if you rotate secrets in `infra/config/local/db.env` but keep the same Docker named volume, management or app role passwords can drift from the file until you remove the volume (`docker compose` teardown with volume removal) or re-apply the bootstrap **sh** so `ALTER USER` runs again.

Dry run:

```bash
npm run db:migrate:linear:dry-run:app
npm run db:migrate:linear:dry-run:management
```

## K8s one-off migration jobs

Suspended CronJobs:

- `metaboost-db-drop-everything` — drops `public` schema on app and management DBs (destructive)
- `metaboost-db-migrate-app`
- `metaboost-db-migrate-management`
- `metaboost-db-verify-bootstrap-contract`
- `metaboost-db-rebootstrap-roles`
- `metaboost-management-superuser-create`
- `metaboost-management-superuser-update`

Trigger one-off jobs during first deploy and any deploy that introduces new migration files. After schema or role recovery, run verify-bootstrap-contract or rebootstrap-roles manually before app rollout.

### Ops-only schema reset (checksum mismatch / edited historical SQL)

When a database already applied older migration file contents and a new release changes those files
(checksum mismatch in migrate job logs), **do not** edit `linear_migration_history` checksums by hand.
For disposable environments (e.g. alpha), reset schema via ops jobs only:

1. `metaboost-db-drop-everything`
2. `metaboost-db-rebootstrap-roles`
3. `metaboost-db-migrate-app`
4. `metaboost-db-migrate-management`
5. `metaboost-db-verify-bootstrap-contract`
6. `metaboost-management-superuser-create`

Then rollout-restart API workloads. Scale down app tiers first if you want a quiet cutover.

From repo root (waits for each job):

```bash
export K8S_NAMESPACE=metaboost-alpha
bash scripts/database/run-ops-db-schema-reset-k8s.sh
```

Or trigger each CronJob manually (Argo CD UI or kubectl):

```bash
kubectl -n <namespace> create job --from=cronjob/metaboost-db-drop-everything metaboost-db-drop-everything-manual-$(date +%s)
kubectl -n <namespace> create job --from=cronjob/metaboost-db-rebootstrap-roles metaboost-db-rebootstrap-roles-manual-$(date +%s)
kubectl -n <namespace> create job --from=cronjob/metaboost-db-migrate-app metaboost-db-migrate-app-manual-$(date +%s)
kubectl -n <namespace> create job --from=cronjob/metaboost-db-migrate-management metaboost-db-migrate-management-manual-$(date +%s)
kubectl -n <namespace> create job --from=cronjob/metaboost-db-verify-bootstrap-contract metaboost-db-verify-bootstrap-contract-manual-$(date +%s)
K8S_NAMESPACE=<namespace> npm run management:superuser:create:k8s
```

**PVC wipe** (empty volume + docker-entrypoint init baselines) is an alternative; you do **not** need
drop/rebootstrap when first-start init runs successfully. See
[REMOTE-K8S-POSTGRES-REINIT.md](/docs/development/k8s/REMOTE-K8S-POSTGRES-REINIT.md).

Example on-demand triggers (individual jobs):

```bash
K8S_NAMESPACE=<namespace> npm run management:superuser:create:k8s
K8S_NAMESPACE=<namespace> npm run management:superuser:update:k8s
kubectl -n <namespace> create job --from=cronjob/metaboost-db-migrate-app metaboost-db-migrate-app-manual-$(date +%s)
kubectl -n <namespace> create job --from=cronjob/metaboost-db-migrate-management metaboost-db-migrate-management-manual-$(date +%s)
kubectl -n <namespace> create job --from=cronjob/metaboost-db-verify-bootstrap-contract metaboost-db-verify-bootstrap-contract-manual-$(date +%s)
kubectl -n <namespace> create job --from=cronjob/metaboost-db-rebootstrap-roles metaboost-db-rebootstrap-roles-manual-$(date +%s)
```

Local bootstrap contract check (requires `infra/config/local/db.env` and running Postgres):

```bash
make db_verify_bootstrap_contract
```

## Staleness protection

- migration scripts and SQL mount from hash-suffixed ConfigMaps;
- jobs use `postgres:18.3` with `imagePullPolicy: Always`;
- pod templates include `MIGRATION_BUNDLE_SHA` for runtime visibility.
