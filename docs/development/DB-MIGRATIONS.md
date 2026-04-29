# Database Migrations (Forward-Only)

Metaboost uses forward-only SQL migrations with one canonical source tree:

- app migrations: `infra/k8s/base/ops/source/database/linear-migrations/app`
- management migrations: `infra/k8s/base/ops/source/database/linear-migrations/management`
- bootstrap-only scripts (DB/users/grants): `infra/k8s/base/db/source/bootstrap`

## First-run contract (brand-new DB)

1. Bring up Postgres on an **empty** volume so **`docker-entrypoint-initdb.d`** runs (order:
   **`0001`** → **`0002`** → generated **`0003_linear_baseline.sql.gz`** → **`0004_seed_linear_migration_history.sql`**
   → **`0006_management_grants.sh`**).
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

- `metaboost-db-migrate-app`
- `metaboost-db-migrate-management`
- `metaboost-management-superuser-create`
- `metaboost-management-superuser-update`

Trigger one-off jobs during first deploy and any deploy that introduces new migration files.

Example on-demand triggers:

```bash
K8S_NAMESPACE=<namespace> npm run management:superuser:create:k8s
K8S_NAMESPACE=<namespace> npm run management:superuser:update:k8s
```

## Staleness protection

- migration scripts and SQL mount from hash-suffixed ConfigMaps;
- jobs use `postgres:18.1` with `imagePullPolicy: Always`;
- pod templates include `MIGRATION_BUNDLE_SHA` for runtime visibility.
