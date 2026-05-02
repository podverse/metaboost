# strict-linear-migration-env

## Metadata

- Started: 2026-04-29
- Author: LLM session

### Session 1 - 2026-04-29

#### Prompt (Developer)

scan through the files. whenever db users are listed, they should ALWAYS be in this order

owner
migrator
read_write
read

also, assess all the changes you made for podverse. metaboost must have the same handling for its db and migrations processes

#### Key Decisions

- Aligned Metaboost DB and migration operational handling with Podverse: bootstrap uses owner roles, forward migration runners use migrator roles, and runtime remains read-write/read.
- Updated key deployment/cronjob/script paths to stop using `DB_*_ADMIN_*` for migration/bootstrap contracts.
- Enforced role listing order where DB users are enumerated: `owner`, `migrator`, `read_write`, `read`.

#### Files Created/Modified

- infra/config/env-templates/db.env.example
- infra/config/env-templates/management-api.env.example
- apps/management-api/.env.example
- infra/k8s/base/db/source/bootstrap/0001_create_app_db_users.sh
- infra/k8s/base/db/source/bootstrap/0002_setup_management_database.sh
- infra/k8s/base/db/source/bootstrap/0003_apply_linear_baselines.sh
- infra/k8s/base/db/source/bootstrap/0006_management_grants.sh
- infra/k8s/base/db/deployment-postgres.yaml
- infra/k8s/base/stack/workloads.yaml
- infra/k8s/base/ops/db-migrate-app.cronjob.yaml
- infra/k8s/base/ops/db-migrate-management.cronjob.yaml
- infra/k8s/base/ops/management-superuser-create.cronjob.yaml
- infra/k8s/base/ops/management-superuser-update.cronjob.yaml
- infra/k8s/base/ops/source/database/runner/run-linear-migrations.sh
- infra/k8s/base/ops/source/database/runner/run-linear-migrations-k8s.sh
- infra/k8s/base/ops/source/database/management-superuser/create-super-admin.mjs
- infra/k8s/base/ops/source/database/management-superuser/update-super-admin.mjs
- scripts/database/run-linear-migrations.sh
- scripts/database/run-linear-migrations-k8s.sh
- scripts/database/db.generate-baseline.env
- scripts/database/generate-linear-baseline.sh
- scripts/database/print-linear-migrations-status-k8s.sh
- scripts/database/run-postgres-bootstrap-in-container.sh
- scripts/database/validate-linear-migrations.sh
- scripts/local-env/local-management-db.sh
- scripts/local-env/setup.sh
- scripts/management-api/create-super-admin.mjs
- scripts/management-api/update-super-admin.mjs
- makefiles/local/Makefile.local.docker.mk
- infra/docker/local/docker-compose.yml
- .cursor/skills/linear-db-migrations/SKILL.md
# strict-linear-migration-env

## Metadata

- Started: 2026-04-29
- Author: LLM session

### Session 1 - 2026-04-29

#### Prompt (Developer)

Strict linear migration credentials (Podverse + Metaboost)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- `scripts/database/run-linear-migrations.sh` and `infra/k8s/base/ops/source/database/runner/run-linear-migrations.sh`:
  prefixed admin credentials only; optional `db.env` sourcing when keys missing.
- `run-linear-migrations-k8s.sh` (both paths): Podverse-parity validation;
  management CronJob env uses `DB_MANAGEMENT_ADMIN_USER`/`DB_MANAGEMENT_ADMIN_PASSWORD`.
- `scripts/database/generate-linear-baseline.sh`: exports prefixed credentials before migrations.
- `scripts/database/print-linear-migrations-status-k8s.sh`: prefixed vars per database.
- `.cursor/skills/linear-db-migrations/SKILL.md`: documented credential contract.

#### Files Created/Modified

- scripts/database/run-linear-migrations.sh
- scripts/database/run-linear-migrations-k8s.sh
- scripts/database/generate-linear-baseline.sh
- scripts/database/print-linear-migrations-status-k8s.sh
- infra/k8s/base/ops/source/database/runner/run-linear-migrations.sh
- infra/k8s/base/ops/source/database/runner/run-linear-migrations-k8s.sh
- infra/k8s/base/ops/db-migrate-management.cronjob.yaml
- .cursor/skills/linear-db-migrations/SKILL.md

### Session 2 - 2026-04-29

#### Prompt (Developer)

you do not need to include notes like "it does not use generic" we would rather just be explicit and not even introduce these concepts which are not even being used

#### Key Decisions

- Docs and runner header comments describe only the required variable names for app and management migrations (including host and port).

#### Files Created/Modified

- .cursor/skills/linear-db-migrations/SKILL.md
- scripts/database/run-linear-migrations.sh
- scripts/database/run-linear-migrations-k8s.sh
- infra/k8s/base/ops/source/database/runner/run-linear-migrations.sh
- infra/k8s/base/ops/source/database/runner/run-linear-migrations-k8s.sh
