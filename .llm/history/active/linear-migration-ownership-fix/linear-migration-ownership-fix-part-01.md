# linear-migration-ownership-fix

**Started:** 2026-04-29  
**Author:** Agent  
**Context:** Same session as Podverse: linear migration ownership fix.

### Session 1 - 2026-04-29

#### Prompt (Developer)

Linear migrations: management job failure — diagnosis and fix

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Same as Podverse repo: seed `REASSIGN OWNED`, Metaboost baseline uses `run-linear-migrations` for both DBs, runner credential fix (`PSQL_*`), INNER exports for DB credentials and `PGHOST`/`PGPORT`.
- Regenerated `0003`/`0004`; `make db_verify_linear_baseline` OK.

#### Files Created/Modified

- `scripts/database/generate-linear-migration-history-seed.sh`
- `scripts/database/generate-linear-baseline.sh`
- `scripts/database/run-linear-migrations.sh`
- `infra/k8s/base/ops/source/database/runner/run-linear-migrations.sh`
- `infra/k8s/base/db/source/bootstrap/0003_linear_baseline.sql.gz`
- `infra/k8s/base/db/source/bootstrap/0004_seed_linear_migration_history.sql`
- `docs/development/DB-MIGRATIONS.md`
