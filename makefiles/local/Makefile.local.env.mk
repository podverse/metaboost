# --- Local env setup (aligned with Podverse: prepare, link, setup, clean). ---

.PHONY: local_env_prepare local_env_link local_env_setup local_env_clean local_setup
.PHONY: env_setup local_env_remove local_db_init_management local_reset_env_infra local_nuke_rebuild_run
.PHONY: local_clean_env_setup_infra_up

# Local Postgres container (from docker-compose) and management DB name for dev
LOCAL_PG_CONTAINER ?= metaboost_local_postgres
LOCAL_PG_USER ?= user
# Must match DB_APP_READ_USER / DB_APP_READ_WRITE_USER in infra/config/local/db.env (roles from source/bootstrap/0001_create_app_db_users.sh).
LOCAL_POSTGRES_READ_USER ?= metaboost_app_read
LOCAL_POSTGRES_READ_WRITE_USER ?= metaboost_app_read_write
# Must match DB_MANAGEMENT_*_USER in infra/config/local/db.env (see scripts/local-env/local-management-db.sh).
LOCAL_POSTGRES_MANAGEMENT_READ_USER ?= metaboost_management_read
LOCAL_POSTGRES_MANAGEMENT_READ_WRITE_USER ?= metaboost_management_read_write
LOCAL_MANAGEMENT_DB_NAME ?= metaboost_management
# Cluster name for local k3d (must match scripts/infra/k3d/*.sh)
K3D_CLUSTER_NAME ?= metaboost-local

local_env_prepare:
	bash scripts/local-env/prepare-local-env-overrides.sh

local_env_link:
	bash scripts/local-env/link-local-env-overrides.sh

# Non-destructive local env setup: seed missing env files from canonical templates/examples,
# generate secrets, apply overrides from dev/env-overrides/local/*.env.
local_env_setup:
	bash scripts/local-env/setup.sh
	@echo "Local env setup complete."

local_env_clean:
	@running=$$(docker ps -q --filter "name=metaboost_local_" 2>/dev/null); \
	if [ -n "$$running" ]; then \
		echo "ERROR: local_env_clean cannot run while Metaboost local containers are running."; \
		echo "Stop them first with: make local_down"; \
		docker ps --filter "name=metaboost_local_" --format "  {{.Names}}"; \
		exit 1; \
	fi
	@if k3d cluster list "$(K3D_CLUSTER_NAME)" >/dev/null 2>&1; then \
		echo "ERROR: local_env_clean cannot run while the k3d cluster is running."; \
		echo "Stop it first with: make local_k3d_down"; \
		exit 1; \
	fi
	@echo "Removing local env files and dev/env-overrides/local/*.env (repo symlinks to home overrides)..."
	@rm -f $(ROOT)infra/config/local/*.env \
		$(ROOT)apps/api/.env \
		$(ROOT)apps/web/.env.local \
		$(ROOT)apps/web/sidecar/.env \
		$(ROOT)apps/management-api/.env \
		$(ROOT)apps/management-web/.env.local \
		$(ROOT)apps/management-web/sidecar/.env
	@rm -f $(ROOT)dev/env-overrides/local/*.env
	@echo "Local env files removed. If you use home overrides, run make local_env_link before make local_env_setup. Home files under ~/.config/metaboost/local-env-overrides/ are unchanged."

# One-shot: env setup then start local infrastructure.
local_setup: local_env_setup local_infra_up

# Full reset: tear down Docker/k3d/tests, remove generated env, re-seed home override stubs, link,
# regenerate env, then start local infrastructure. Sequential (safe with make -j).
local_clean_env_setup_infra_up:
	$(MAKE) local_clean
	$(MAKE) local_env_clean
	$(MAKE) local_env_prepare
	$(MAKE) local_env_link
	$(MAKE) local_env_setup
	$(MAKE) local_infra_up

# Backward-compatible alias (canonical target is local_env_setup). See docs/development/env/LOCAL-ENV-OVERRIDES.md.
env_setup: local_env_setup
	@echo "Env files ready (infra/config/local/*.env, apps/*/.env or .env.local)."
	@echo "apps/api/.env is set for API-on-host (localhost:5532, localhost:6479). infra/config/local/api.env is for Docker (postgres, valkey)."
	@echo "apps/management-api/.env is set for Management API on host."
	@echo "After make local_infra_up, run make local_db_migrate_linear_all and make local_create_super_admin."

# Remove local .env files (prompts for Y). Runs local_clean first. Prefer prepare/link/setup flow; see docs/development/env/LOCAL-ENV-OVERRIDES.md.
local_env_remove: local_clean
	@bash scripts/remove-local-env.sh

# Full reset: remove env and containers, recreate env, then bring up Postgres and Valkey.
local_reset_env_infra:
	$(MAKE) local_env_remove
	$(MAKE) env_setup
	$(MAKE) local_infra_up

# Nuclear rebuild (Podverse-aligned): tear down, prune app images, env setup, infra, then build
# and start all app containers in Docker. After local_env_clean, runs
# local_env_prepare and local_env_link (same as local_clean_env_setup_infra_up) so home overrides
# are restored before local_env_setup. For stuck host dev ports, run
# scripts/development/kill-metaboost-port-blockers.sh manually (not invoked from Make).
local_nuke_rebuild_run:
	$(MAKE) local_clean
	$(MAKE) local_env_clean
	$(MAKE) local_env_prepare
	$(MAKE) local_env_link
	$(MAKE) local_prune_metaboost_images
	$(MAKE) local_env_setup
	$(MAKE) local_infra_up
	$(MAKE) local_apps_up_build
	@echo ""
	@echo "============================================"
	@echo "Local environment fully rebuilt and running!"
	@echo "============================================"
	@echo "  API:              http://127.0.0.1:4000"
	@echo "  Web:              http://127.0.0.1:4002"
	@echo "  Management API:   http://127.0.0.1:4100"
	@echo "  Management Web:   http://127.0.0.1:4102"
	@echo "  pgAdmin:          http://127.0.0.1:4050"
	@echo "Stop app containers: make local_apps_down | Stop everything: make local_down"
	@echo ""

# Reset management database in local Postgres (metaboost_local_postgres). Run after local_infra_up.
# This prepares an empty management database and roles; run linear migrations and create/update the superuser as separate steps.
local_db_init_management:
	@docker ps -q -f name=^/$(LOCAL_PG_CONTAINER)$$ | grep -q . || (echo "Error: Start local Postgres first: make local_infra_up"; exit 1)
	@echo "Creating management database $(LOCAL_MANAGEMENT_DB_NAME)..."
	@docker exec $(LOCAL_PG_CONTAINER) psql -U $(LOCAL_PG_USER) -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(LOCAL_MANAGEMENT_DB_NAME)' AND pid <> pg_backend_pid();" 2>/dev/null || true
	@docker exec $(LOCAL_PG_CONTAINER) psql -U $(LOCAL_PG_USER) -d postgres -c "DROP DATABASE IF EXISTS $(LOCAL_MANAGEMENT_DB_NAME);"
	@docker exec $(LOCAL_PG_CONTAINER) psql -U $(LOCAL_PG_USER) -d postgres -c "CREATE DATABASE $(LOCAL_MANAGEMENT_DB_NAME);"
	@bash $(ROOT)scripts/local-env/local-management-db.sh $(LOCAL_PG_CONTAINER) create-roles
	@bash $(ROOT)scripts/local-env/local-management-db.sh $(LOCAL_PG_CONTAINER) grants $(LOCAL_MANAGEMENT_DB_NAME)
	@echo "Management database $(LOCAL_MANAGEMENT_DB_NAME) reset with roles/grants."
	@echo "Next steps:"
	@echo "  make local_db_migrate_linear_management"
	@echo "  make local_create_super_admin"
