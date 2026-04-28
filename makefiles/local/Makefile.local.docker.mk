# --- Local Docker: network and compose services (infra/docker/local). ---

# Compose interpolation: postgres.environment reads DB_APP_ADMIN_USER, DB_APP_ADMIN_PASSWORD, DB_APP_NAME from merged infra/config/local/db.env.
COMPOSE_LOCAL_ENV ?= --env-file infra/config/local/db.env

# Empty stubs for missing paths so docker compose stop/down works after local_env_clean (see scripts/local-env/ensure-compose-local-env-paths.sh).
compose_local_teardown_paths:
	@bash scripts/local-env/ensure-compose-local-env-paths.sh

.PHONY: local_network_create local_infra_up local_all_up local_postgres_wait local_create_super_admin local_update_super_admin
.PHONY: local_db_migrate_linear_app local_db_migrate_linear_management local_db_migrate_linear_all
.PHONY: local_create_super_admin_k8s local_update_super_admin_k8s
.PHONY: local_postgres_up local_valkey_up local_pgadmin_up local_sidecar_up local_api_up local_web_up
.PHONY: local_management_api_up local_management_web_sidecar_up local_management_web_up
.PHONY: compose_local_teardown_paths local_postgres_down local_valkey_down local_sidecar_down local_api_down local_web_down
.PHONY: local_management_api_down local_management_web_sidecar_down local_management_web_down
.PHONY: local_apps_up local_apps_up_build local_start_all_apps local_apps_down local_down local_down_volumes local_clean
.PHONY: local_prune_metaboost_images

# Built app services (compose names). Infra: postgres, valkey, metaboost_local_pgadmin.
LOCAL_COMPOSE_APP_SERVICES := metaboost_local_api metaboost_local_management_api metaboost_local_web_sidecar metaboost_local_management_web_sidecar metaboost_local_web metaboost_local_management_web

local_network_create:
	docker network create $(LOCAL_NETWORK) 2>/dev/null || true

# Wait for Postgres to accept connections and app DB roles (read + read_write from canonical
# source/bootstrap/0001_create_app_db_users.sh) so management DB init can run.
local_postgres_wait:
	@echo "Waiting for Postgres (and app read/read_write users) to be ready..."
	@for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do \
	  c=$$(docker exec $(LOCAL_PG_CONTAINER) psql -U $(LOCAL_PG_USER) -d postgres -tAc "SELECT COUNT(*) FROM pg_roles WHERE rolname IN ('$(LOCAL_POSTGRES_READ_USER)','$(LOCAL_POSTGRES_READ_WRITE_USER)')" 2>/dev/null || echo 0); \
	  [ "$$c" = "2" ] && exit 0; \
	  sleep 1; \
	done; \
	echo "Error: Timeout waiting for Postgres (and app read/read_write users). Is Postgres running? Run: make local_infra_up"; exit 1

# Postgres + Valkey + pgAdmin only.
# pgAdmin is available at http://localhost:4050 — no login required; both databases pre-connected.
local_infra_up: local_network_create
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d postgres valkey metaboost_local_pgadmin
	$(MAKE) local_postgres_wait
	@echo "Next steps:"
	@echo "  make local_db_migrate_linear_all"
	@echo "  make local_create_super_admin"

# Create super admin in management DB.
# Pass SUPERUSER_ARGS to choose mode, for example:
# - make local_create_super_admin SUPERUSER_ARGS="--prompt"
# - make local_create_super_admin SUPERUSER_ARGS="-u superuser --random-password"
local_create_super_admin:
	node scripts/management-api/create-super-admin.mjs $(SUPERUSER_ARGS)
	@echo "Next step: make local_apps_up"

# Update (or create if missing) super admin in management DB.
# Pass SUPERUSER_ARGS to choose mode, for example:
# - make local_update_super_admin SUPERUSER_ARGS="--random-password"
# - make local_update_super_admin SUPERUSER_ARGS="-u superuser -p Test!1Aa"
local_update_super_admin:
	node scripts/management-api/update-super-admin.mjs $(SUPERUSER_ARGS)
	@echo "Next step: make local_apps_up"

local_db_migrate_linear_app:
	@set -a; . infra/config/local/db.env; set +a; \
	DB_HOST="localhost" DB_PORT="5532" DB_APP_ADMIN_USER="$$DB_APP_ADMIN_USER" DB_APP_ADMIN_PASSWORD="$$DB_APP_ADMIN_PASSWORD" DB_NAME="$$DB_APP_NAME" \
	bash scripts/database/run-linear-migrations.sh --database app
	@echo "Next step: make local_db_migrate_linear_management"

local_db_migrate_linear_management:
	@set -a; . infra/config/local/db.env; set +a; \
	DB_HOST="localhost" DB_PORT="5532" DB_APP_ADMIN_USER="$$DB_APP_ADMIN_USER" DB_APP_ADMIN_PASSWORD="$$DB_APP_ADMIN_PASSWORD" DB_NAME="$$DB_MANAGEMENT_NAME" \
	bash scripts/database/run-linear-migrations.sh --database management
	@echo "Next step: make local_create_super_admin"

local_db_migrate_linear_all: local_db_migrate_linear_app local_db_migrate_linear_management
	@echo "Linear migrations complete for app and management databases."

local_create_super_admin_k8s:
	@K8S_NAMESPACE="$${K8S_NAMESPACE:-metaboost-local}" npm run management:superuser:create:k8s
	@echo "Next step: watch job logs with kubectl -n metaboost-local logs -f job/<name>"

local_update_super_admin_k8s:
	@K8S_NAMESPACE="$${K8S_NAMESPACE:-metaboost-local}" npm run management:superuser:update:k8s
	@echo "Next step: watch job logs with kubectl -n metaboost-local logs -f job/<name>"

# Full stack in Docker (Path B: API, web, sidecar, Postgres, Valkey). Does not run local_env_setup.
local_all_up: local_network_create
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up --build

local_postgres_up: local_network_create
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d postgres

local_valkey_up: local_network_create
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d valkey

local_pgadmin_up: local_network_create local_postgres_up
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d metaboost_local_pgadmin

local_sidecar_up: local_network_create
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d metaboost_local_web_sidecar

local_api_up: local_network_create local_postgres_up
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d metaboost_local_api

local_web_up: local_sidecar_up
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d metaboost_local_web

local_management_api_up: local_network_create local_postgres_up
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d metaboost_local_management_api

local_management_web_sidecar_up: local_network_create
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d metaboost_local_management_web_sidecar

local_management_web_up: local_management_api_up local_management_web_sidecar_up
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d metaboost_local_management_web

local_postgres_down: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . stop postgres 2>/dev/null || true

local_valkey_down: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . stop valkey 2>/dev/null || true

local_sidecar_down: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . stop metaboost_local_web_sidecar 2>/dev/null || true

local_api_down: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . stop metaboost_local_api 2>/dev/null || true

local_web_down: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . stop metaboost_local_web 2>/dev/null || true

local_management_api_down: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . stop metaboost_local_management_api 2>/dev/null || true

local_management_web_sidecar_down: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . stop metaboost_local_management_web_sidecar 2>/dev/null || true

local_management_web_down: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . stop metaboost_local_management_web 2>/dev/null || true

# Remove locally built Metaboost app images (aligned with Podverse local_prune_*). Portable; no GNU xargs -r.
# Base images (postgres, valkey, pgadmin) are not removed.
local_prune_metaboost_images:
	@echo "Removing Metaboost app images..."
	@for img in metaboost-api:latest metaboost-web-sidecar:latest metaboost-management-web-sidecar:latest metaboost-web:latest metaboost-management-api:latest metaboost-management-web:latest metaboost-dev-watch:latest; do \
	  docker rmi -f "$$img" 2>/dev/null || true; \
	done
	@echo "Clearing Docker build cache..."
	@docker builder prune -f 2>/dev/null || true
	@echo "Done. Base images (postgres, valkey, pgadmin) preserved."

# Start only app containers (API, management-api, web-sidecar, management-web-sidecar, web, management-web). Postgres and Valkey must already be running (e.g. local_infra_up).
local_apps_up: local_network_create
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d $(LOCAL_COMPOSE_APP_SERVICES)

# Same as local_apps_up but rebuild images first (use after local_infra_up or for local_nuke_rebuild_run).
local_apps_up_build: local_network_create
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . up -d --build $(LOCAL_COMPOSE_APP_SERVICES)

# Podverse-aligned name: start all app containers without rebuild (depends on infra).
local_start_all_apps: local_apps_up

# Stop only app containers (API, management-api, web-sidecar, management-web-sidecar, web, management-web). Postgres and Valkey are left running.
local_apps_down: local_api_down local_management_api_down local_sidecar_down local_management_web_sidecar_down local_web_down local_management_web_down

# Remove containers and built app images (api, management-api, web-sidecar, management-web-sidecar, web, management-web). Postgres and
# valkey are pulled images, not built here, so they are never removed and persist for convenience.
local_down: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . down --rmi local
	@bash scripts/local-env/remove-metaboost-local-containers.sh

local_down_volumes: compose_local_teardown_paths
	docker compose $(COMPOSE_LOCAL_ENV) -f $(COMPOSE_LOCAL) --project-directory . down -v --rmi local
	@bash scripts/local-env/remove-metaboost-local-containers.sh

# Also stop k3d cluster (if present) and test/E2E containers (metaboost_test_postgres, metaboost_test_valkey, metaboost_e2e_mailpit).
local_clean: local_down local_down_volumes local_k3d_down test_clean
