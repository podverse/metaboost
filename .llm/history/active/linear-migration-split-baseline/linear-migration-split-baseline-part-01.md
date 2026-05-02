# linear-migration-split-baseline

**Started:** 2026-04-29  
**Author:** Agent  
**Context:** Split linear baseline into app/management gz artifacts applied by role-specific owners (green-field; no REASSIGN OWNED in 0004).

### Session 1 - 2026-04-29

#### Prompt (Developer)

continue

#### Key Decisions

- **`0003_apply_linear_baselines.sh`** applies **`0003a_app_linear_baseline.sql.gz`** and **`0003b_management_linear_baseline.sql.gz`** with correct **`PGPASSWORD`** per DB owner; mount **`/linear-baseline/`** for gz payloads.
- Removed **`REASSIGN OWNED`** from **`generate-linear-migration-history-seed.sh`**; seed **`0004`** only inserts migration-history rows.
- Docs: **`INFRA-DOCKER-LOCAL.md`**, **`REMOTE-K8S-POSTGRES-REINIT.md`**, **`INFRA-K8S.md`**, **`LINEAR-MIGRATIONS-REFERENCE-ALIGNMENT-CHECKLIST-05A.md`** aligned with split baseline contract.

#### Files Created/Modified

- `infra/k8s/base/db/source/bootstrap/0003_apply_linear_baselines.sh`
- `infra/k8s/base/db/source/bootstrap/0003a_app_linear_baseline.sql.gz`, `0003b_management_linear_baseline.sql.gz`, `0004_seed_linear_migration_history.sql`
- `scripts/database/generate-linear-baseline.sh`, `verify-linear-baseline.sh`, `generate-linear-migration-history-seed.sh`
- `infra/k8s/base/db/kustomization.yaml`, `deployment-postgres.yaml`, `infra/k8s/base/stack/workloads.yaml`, `infra/docker/local/docker-compose.yml`
- `infra/docker/local/INFRA-DOCKER-LOCAL.md`, `docs/development/k8s/REMOTE-K8S-POSTGRES-REINIT.md`, `infra/k8s/INFRA-K8S.md`, `docs/development/repo-management/LINEAR-MIGRATIONS-REFERENCE-ALIGNMENT-CHECKLIST-05A.md`
