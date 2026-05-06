### Metadata
- Started: 2026-05-05
- Author: Agent
- Context: Greenfield-only linear SQL migration rewrite (Podverse + Metaboost)

### Session 1 - 2026-05-05
#### Prompt (Developer)
Greenfield-Only Migration Rewrite (Podverse + Metaboost)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions
- Dropped `linear_migration_history` CREATE from app/management `0001_*` migrations to avoid duplicate with `runner/run-linear-migrations.sh` bootstrap.
- Replaced upgrade-only 0002 `DO $$` rename with no-op `SELECT 1` (column already canonical in 0001).
- Terms, billing seeds, product_membership_settings: unconditional `INSERT` / `VALUES`.
- 0004 backfill: `INSERT … SELECT` from `"user"` only (empty `user_trust_settings` on greenfield).
- 0005: `DROP CONSTRAINT` / `DROP COLUMN` without `IF EXISTS`.
- Management 0001: plain `CREATE TABLE` / `CREATE INDEX` (no `IF NOT EXISTS`).
- Regenerated `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz` and `0003b_management_linear_baseline.sql.gz`; verify + validate scripts passed.

#### Files Created/Modified
- `infra/k8s/base/ops/source/database/linear-migrations/app/0001_app_schema.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0002_bucket_settings_public_boost_display_minimum.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0003_terms_default_seed.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0004_user_trust_and_entitlement_overrides.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0005_remove_user_trust_tier.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/app/0006_billing_catalog_and_trust_renewal.sql`
- `infra/k8s/base/ops/source/database/linear-migrations/management/0001_management_schema.sql`
- `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`
- `infra/k8s/base/db/source/bootstrap/0003b_management_linear_baseline.sql.gz`

### Session 2 - 2026-05-05
#### Prompt (Developer)
make sure that this choice is in skill files so you remember to follow this standard going forward

#### Key Decisions
- Documented greenfield-only linear SQL authoring in `linear-db-migrations` and `linear-baseline-gz-sync` skills; Podverse gained dedicated `linear-sql-greenfield-only` skill plus docs/rule cross-links (repo-local).

#### Files Created/Modified
- `.cursor/skills/linear-db-migrations/SKILL.md`
- `.cursor/skills/linear-baseline-gz-sync/SKILL.md`
