# metaboost-local-db-infra-parity

Started: 2026-04-28  
Author: Agent  
Context: Align Metaboost local Docker Postgres bootstrap with K8s (`0001`–`0006` in initdb); mount dev seed outside initdb; `make local_db_init`.

---

### Session 1 - 2026-04-28

#### Prompt (Developer)

implement

#### Key Decisions

- Compose mounts **`0003_linear_baseline.sql.gz`** and **`0004_seed_linear_migration_history.sql`** into **`docker-entrypoint-initdb.d/`**; **`0008`** mounts only to **`/opt/database/seed-scripts/local-dev-account.sql`** for **`make local_db_init`** via **`psql -f`**.
- Added **`scripts/database/run-postgres-bootstrap-in-container.sh`** (steps **1** / **2** / **all**) with Metaboost **`0002_setup_management_database.sh`** path.
- **`local_db_init`**: wait → app linear migrations → bootstrap **0001** → seed → management linear migrations.
- **`local_setup`**, **`local_clean_env_setup_infra_up`**, **`local_reset_env_infra`**, **`local_nuke_rebuild_run`** invoke **`local_db_init`** where appropriate; **`local_infra_up`** next-steps point to **`local_db_init`**.
- Docs: **`docs/QUICK-START.md`**, **`infra/docker/local/INFRA-DOCKER-LOCAL.md`**, **`infra/k8s/INFRA-K8S.md`**, **`makefiles/local/Makefile.local.mk`** header.

#### Files Created/Modified

- `scripts/database/run-postgres-bootstrap-in-container.sh` (new)
- `infra/docker/local/docker-compose.yml`
- `makefiles/local/Makefile.local.docker.mk`
- `makefiles/local/Makefile.local.env.mk`
- `makefiles/local/Makefile.local.mk`
- `docs/QUICK-START.md`
- `infra/docker/local/INFRA-DOCKER-LOCAL.md`
- `infra/k8s/INFRA-K8S.md`
- `.llm/history/active/metaboost-local-db-infra-parity/metaboost-local-db-infra-parity-part-01.md`

---

### Session 2 - 2026-04-28

#### Prompt (Developer)

Debug (`make local_db_init`): `psql: command not found`. Prefer dev-shell **`psql`** and a Docker-exec fallback.

#### Key Decisions

- Added **`postgresql`** to **`flake.nix`** **`buildInputs`** so **`psql`** is on **`PATH`** in the Nix dev shell.
- **`run-linear-migrations.sh`**: if **`psql`** is absent, use **`docker exec`** into **`METABOOST_LOCAL_PG_CONTAINER`** (default **`metaboost_local_postgres`**) and connect to **`127.0.0.1:5432`** inside the container (same pattern as **`generate-linear-baseline.sh`** / bootstrap scripts).
- Synced **`infra/k8s/base/ops/source/database/runner/run-linear-migrations.sh`** copy from **`scripts/database/`**; **`INFRA-DOCKER-LOCAL.md`** documents behavior.

#### Files Created/Modified

- `scripts/database/run-linear-migrations.sh`
- `infra/k8s/base/ops/source/database/runner/run-linear-migrations.sh`
- `flake.nix`
- `infra/docker/local/INFRA-DOCKER-LOCAL.md`
- `.llm/history/active/metaboost-local-db-infra-parity/metaboost-local-db-infra-parity-part-01.md`

---

### Session 3 - 2026-04-28

#### Prompt (Developer)

Debug (`make local_management_superuser_create`): password authentication failed for user **`user`**.

#### Key Decisions

- **`make local_db_init`** sources **`infra/config/local/db.env`** for migrations; **`create-super-admin.mjs`** / **`update-super-admin.mjs`** only loaded **`apps/management-api/.env`**, so **`DB_APP_ADMIN_PASSWORD`** could disagree → **`password authentication failed for user "user"`**.
- Load **`db.env`** after app env with **`override: true`** (canonical DB secrets).
- **`getDbConfig`**: prefer **`DB_MANAGEMENT_READ_WRITE_*`**, then **`DB_MANAGEMENT_ADMIN_*`**, then **`DB_APP_ADMIN_*`** (matches management-api runtime).
- Synced **`infra/k8s/base/ops/source/database/management-superuser/*.mjs`** copies.

#### Files Created/Modified

- `scripts/management-api/create-super-admin.mjs`
- `scripts/management-api/update-super-admin.mjs`
- `infra/k8s/base/ops/source/database/management-superuser/create-super-admin.mjs`
- `infra/k8s/base/ops/source/database/management-superuser/update-super-admin.mjs`
- `.llm/history/active/metaboost-local-db-infra-parity/metaboost-local-db-infra-parity-part-01.md`

---

### Session 4 - 2026-04-29

#### Prompt (Developer)

Fix `local_infra_up` / Postgres init: `role "postgres" does not exist`

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Set **`scripts/database/db.generate-baseline.env`** **`DB_APP_ADMIN_USER`** to **`user`** (match **`infra/config/env-templates/db.env.example`**).
- Ran **`make db_regen_linear_baseline`** and **`make db_verify_linear_baseline`**; **`0003`** now has **`FOR ROLE "user"`** not **`postgres`**.
- Docs: **`infra/docker/local/INFRA-DOCKER-LOCAL.md`**, **`docs/development/DB-MIGRATIONS.md`**.
- Verified with **`make local_down_volumes`** then **`make local_infra_up`** (Postgres healthy).

#### Files Created/Modified

- `scripts/database/db.generate-baseline.env`
- `infra/k8s/base/db/source/bootstrap/0003_linear_baseline.sql.gz`
- `infra/k8s/base/db/source/bootstrap/0004_seed_linear_migration_history.sql`
- `infra/docker/local/INFRA-DOCKER-LOCAL.md`
- `docs/development/DB-MIGRATIONS.md`
- `.llm/history/active/metaboost-local-db-infra-parity/metaboost-local-db-infra-parity-part-01.md`

---

### Session 5 - 2026-04-29

#### Prompt (Developer)

DB_APP_ADMIN_USER should align with the patterns of podverse and metaboost management. i think the expected username should be metaboost_app_admin.

#### Key Decisions

- Canonical **`DB_APP_ADMIN_USER`** default **`metaboost_app_admin`** (templates, Compose **`POSTGRES_USER`** / healthcheck fallbacks, **`LOCAL_PG_USER`**, K8s **`pg_isready`** defaults, bootstrap **`PG_SUPERUSER`** defaults, **`local-management-db.sh`**).
- Regenerated **`0003_linear_baseline.sql.gz`** / **`0004_seed_linear_migration_history.sql`** so **`ALTER DEFAULT PRIVILEGES FOR ROLE`** matches **`metaboost_app_admin`** (same invariant as Session 4).
- Docs: **`ENV-VARS-CATALOG.md`**, **`ENV-VARS-REFERENCE.md`**, **`AGENTS.md`**.

#### Files Created/Modified

- `infra/config/env-templates/db.env.example`
- `infra/config/env-templates/management-api.env.example`
- `apps/management-api/.env.example`
- `scripts/database/db.generate-baseline.env`
- `infra/docker/local/docker-compose.yml`
- `makefiles/local/Makefile.local.env.mk`
- `infra/k8s/base/stack/workloads.yaml`
- `infra/k8s/base/db/deployment-postgres.yaml`
- `infra/k8s/base/db/source/bootstrap/0001_create_app_db_users.sh`
- `infra/k8s/base/db/source/bootstrap/0002_setup_management_database.sh`
- `infra/k8s/base/db/source/bootstrap/0006_management_grants.sh`
- `infra/k8s/base/db/source/bootstrap/0003_linear_baseline.sql.gz`
- `infra/k8s/base/db/source/bootstrap/0004_seed_linear_migration_history.sql`
- `scripts/local-env/local-management-db.sh`
- `docs/development/env/ENV-VARS-CATALOG.md`
- `docs/development/env/ENV-VARS-REFERENCE.md`
- `AGENTS.md`
- `.llm/history/active/metaboost-local-db-infra-parity/metaboost-local-db-infra-parity-part-01.md`

---

### Session 6 - 2026-04-29

#### Prompt (Developer)

is local_create_super_admin the same name as the corresponding command in podverse? if not, make these metaboost commands align with the naming convention of podverse

#### Key Decisions

- Podverse: **`local_management_superuser_create`** / **`local_management_superuser_update`** and **`_k8s`** variants (`podverse` **`makefiles/local/Makefile.local.infra.mk`**).
- Metaboost: Renamed primary targets to match; kept **`local_create_super_admin`** etc. as **deprecated aliases** delegating to the new targets.

#### Files Created/Modified

- `makefiles/local/Makefile.local.docker.mk`
- `makefiles/local/Makefile.local.env.mk`
- `makefiles/local/Makefile.local.mk`
- `docs/QUICK-START.md`
- `.llm/history/active/metaboost-local-db-infra-parity/metaboost-local-db-infra-parity-part-01.md`

---

### Session 7 - 2026-04-29

#### Prompt (Developer)

Clean Startup for Local Superuser Flow

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Root cause confirmed from local run logs: `local_management_superuser_create` executed Node on host while `create-super-admin.mjs` loaded `infra/config/local/db.env` with `DB_HOST=postgres`; host DNS cannot resolve `postgres` (`ENOTFOUND`).
- Aligned with Podverse startup pattern by containerizing `local_management_superuser_create` / `local_management_superuser_update` on `metaboost_local_network`.
- To avoid host `node_modules` and native binary drift, the container installs only runtime deps (`dotenv`, `pg`, `bcrypt`) ephemerally (`--no-save`) and runs the existing scripts from a mounted `scripts/management-api` directory.
- Preserved `--prompt` support by conditionally adding Docker TTY flags (`-it`) only when running from an interactive terminal.
- Kept legacy aliases (`local_create_super_admin*`) delegating to Podverse-aligned target names for backward compatibility.
- Updated onboarding hints to call out that management superuser creation now runs in a temporary Docker container on `metaboost_local_network`.

#### Files Created/Modified

- `makefiles/local/Makefile.local.docker.mk`
- `makefiles/local/Makefile.local.env.mk`
- `docs/QUICK-START.md`
- `.llm/history/active/metaboost-local-db-infra-parity/metaboost-local-db-infra-parity-part-01.md`

---

### Session 8 - 2026-04-29

#### Prompt (Developer)

sweep through metaboost code for references to "podverse-style" we want to remove these comments completely, they are only creating noise. metaboost is it's own standalone product

#### Key Decisions

- Removed Podverse-referential wording from operational comments/docs in active Metaboost runtime files to keep messaging product-native.
- Kept `.llm/**` historical plan/history wording unchanged except for this session log; those files are archival context, not runtime docs/comments.

#### Files Created/Modified

- `scripts/local-env/setup.sh`
- `makefiles/local/Makefile.local.mk`
- `makefiles/local/Makefile.local.docker.mk`
- `docs/QUICK-START.md`
- `.llm/history/active/metaboost-local-db-infra-parity/metaboost-local-db-infra-parity-part-01.md`
