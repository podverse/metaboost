# Local Docker

API (4000), management-api (4100), web (4002), management-web (4102), postgres (5532),
valkey (6479) exposed on host. **Sidecars are never exposed in Docker or K8s** — web and
management-web sidecars have no host port mapping; only the web/management-web containers
reach them on the internal network via RUNTIME_CONFIG_URL. Sidecars are only reachable on
localhost when run via `npm run dev` (e.g. `npm run dev:web-sidecar`, port 4001;
`npm run dev:management-web-sidecar`, port 4101); those processes load **`apps/*/sidecar/.env`** from **`merge-env --profile dev`**, while Compose sidecar containers use **`infra/config/local/*-sidecar.env`** (**`local_docker`**). Shared network:
`metaboost_local_network`. Host ports 5532/6479 avoid conflict with default Postgres/Valkey
(5432/6379), including when another project on the same machine uses those default ports.

## First run

1. Prepare env (from repo root): `make local_env_setup` (or use the home-directory flow:
   `make local_env_prepare`, edit `~/.config/metaboost/local-env-overrides/`, `make local_env_link`,
   `make local_env_setup` — see [docs/development/env/LOCAL-ENV-OVERRIDES.md](../../docs/development/env/LOCAL-ENV-OVERRIDES.md)).
2. From repo root:  
   `docker compose -f infra/docker/local/docker-compose.yml --project-directory . up --build`

## Start infra (Postgres, Valkey, and management DB)

From repo root:

- `make local_infra_up` — starts Postgres and Valkey (and pgAdmin). On **first** container start with an empty data volume, Postgres runs the same bootstrap sequence as K8s (`0001`…`0003b` under `/docker-entrypoint-initdb.d/`, including **`0003_apply_linear_baselines.sh`** and generated **`0003a`** / **`0003b`** baseline archives). The dev-only user seed file is **not** run at init (it is applied by **`make local_db_init`**). The app baseline includes `ALTER DEFAULT PRIVILEGES FOR ROLE …` for whoever **`POSTGRES_USER`** is (`DB_APP_OWNER_USER` from **`infra/config/local/db.env`**); **`scripts/database/db.generate-baseline.env`** must use that **same** name when running **`make db_regen_linear_baseline`**, or init fails with a missing role (see **`docs/development/DB-MIGRATIONS.md`**).
- `make local_db_init` — waits for Postgres, applies **app** then **management** linear migrations, re-runs bootstrap **`0001`** (role passwords/grants), applies the dev seed from **`/opt/database/seed-scripts/local-dev-account.sql`** (`0008` content), then runs management migrations. Run after `local_infra_up` (or use **`make local_setup`**, which runs `local_env_setup`, `local_infra_up`, and `local_db_init`). Safe to re-run after rotating DB passwords in `db.env`. **`scripts/database/run-linear-migrations.sh`** uses host **`psql`** when it is on `PATH` (the Nix flake includes **`postgresql`**); if **`psql`** is missing, it runs **`psql` inside the Postgres container** via **`docker exec`** (container name **`metaboost_local_postgres`**, or **`METABOOST_LOCAL_PG_CONTAINER`**).

To start only Postgres or Valkey (no management DB):

- `docker compose -f infra/docker/local/docker-compose.yml --project-directory . up postgres`
- `docker compose -f infra/docker/local/docker-compose.yml --project-directory . up valkey`

Default terms rows are created when **api** / **management-api** first start if `terms_version` is empty (not by init SQL).
The local-only dev account (**localdev@example.com** / **Test!1Aa**) is inserted by **`make local_db_init`** (seed file mounted at **`/opt/database/seed-scripts/local-dev-account.sql`**), not during initdb.
API/ORM use `DB_HOST=postgres` and `KEYVALDB_HOST=valkey` when running in Docker (Compose service hostname `valkey`). Kubernetes bases use cluster DNS `metaboost-db` / `metaboost-keyvaldb` for Postgres and Valkey Services.

If Postgres previously failed during init (e.g. ordering bug) or you need a clean data directory, remove the volume and retry: **`make local_down_volumes`** or **`docker volume rm metaboost_postgres_data`**, then **`make local_infra_up`** and **`make local_db_init`**.

## Build only

- API: `docker compose -f infra/docker/local/api/docker-compose.yml build` (from api dir, or use
  combined compose with --project-directory .)
- Combined (all apps): `docker compose -f infra/docker/local/docker-compose.yml --project-directory . build`

## Start/stop app containers only

- `make local_apps_up` — starts API, management-api, web-sidecar, management-web-sidecar,
  web, management-web (Postgres and Valkey must already be running via
  `make local_infra_up`).
- `make local_apps_down` — stops those six app containers. `make local_down` — removes
  app containers and their images (api, management-api, web-sidecar,
  management-web-sidecar, web, management-web).

If using per-service compose files, create the network first:  
`docker network create metaboost_local_network`

## Postgres 18+ volume

Postgres 18+ uses a volume mount at `/var/lib/postgresql` (not `/var/lib/postgresql/data`). If
Postgres exits with a "pg_ctlcluster" or data-directory error (e.g. after upgrading the image),
remove the old volume and start again:

```bash
make local_down
docker volume rm metaboost_postgres_data
make local_infra_up
```
