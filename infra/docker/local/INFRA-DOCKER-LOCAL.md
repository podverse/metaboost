# Local Docker

API (4000), management-api (4100), web (4002), management-web (4102), postgres (5532),
valkey (6479) exposed on host. **Sidecars are never exposed in Docker or K8s** — web and
management-web sidecars have no host port mapping; only the web/management-web containers
reach them on the internal network via RUNTIME_CONFIG_URL. Sidecars are only reachable on
localhost when run via `npm run dev` (e.g. `npm run dev:web-sidecar`, port 4001;
`npm run dev:management-web-sidecar`, port 4101); those processes load **`apps/*/sidecar/.env`** from **`merge-env --profile dev`**, while Compose sidecar containers use **`infra/config/local/*-sidecar.env`** (**`local_docker`**). Shared network:
`metaboost_local_network`. Host ports 5532/6479 avoid conflict with default Postgres/Valkey
(5432/6379), including when the Podverse monorepo uses those defaults locally.

## First run

1. Prepare env (from repo root): `make local_env_setup` (or use the home-directory flow:
   `make local_env_prepare`, edit `~/.config/metaboost/local-env-overrides/`, `make local_env_link`,
   `make local_env_setup` — see [docs/development/LOCAL-ENV-OVERRIDES.md](../../docs/development/LOCAL-ENV-OVERRIDES.md)).
2. From repo root:  
   `docker compose -f infra/docker/local/docker-compose.yml --project-directory . up --build`

## Start infra (Postgres, Valkey, and management DB)

From repo root:

- `make local_infra_up` — starts Postgres and Valkey, waits for Postgres init, then creates the **management** database (`metaboost_management`) so both the main API and the Management API can run on the host (e.g. `npm run dev:all:watch`).

To start only Postgres or Valkey (no management DB):

- `docker compose -f infra/docker/local/docker-compose.yml --project-directory . up postgres`
- `docker compose -f infra/docker/local/docker-compose.yml --project-directory . up valkey`

Postgres runs `infra/k8s/base/stack/postgres-init/0003_app_schema.sql` on first start (combined from migrations), then
`seed_local_user.sql`, which inserts a predefined user for local dev: **localdev@example.com** /
**Test!1Aa**. API/ORM use DB_HOST=postgres and VALKEY_HOST=valkey when running in Docker.

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
