# --- Test requirements (local). Default host ports 5632 (Postgres) and 6579 (Valkey): Metaboost dev Docker uses 5532/6479;
#    Default local Postgres/Valkey often use 5432/6379. Test stacks must not collide with dev local_* containers. ---

.PHONY: test_deps test_postgres_up test_valkey_up test_db_init test_db_init_management test_db_list help_test test_check test_clean validate_ci

# Default test ports (must match apps/api/src/test/setup.ts and apps/management-api/src/test/setup.ts defaults)
TEST_DB_PORT ?= 5632
TEST_KEYVALDB_PORT ?= 6579
TEST_PG_USER ?= postgres
TEST_PG_PASSWORD ?= postgres
TEST_DB_NAME ?= metaboost_app_test
TEST_MANAGEMENT_DB_NAME ?= metaboost_management_test

TEST_PG_CONTAINER := metaboost_test_postgres
TEST_VALKEY_CONTAINER := metaboost_test_valkey

# Run the same steps as the CI validate job (linear migration validation, build, lint, i18n, type-check, security checks, test_deps, npm run test). Use after npm ci.
validate_ci:
	@echo "============================================"
	@echo "  CI validate (local)"
	@echo "============================================"
	@bash scripts/database/validate-linear-migrations.sh
	@$(MAKE) check_k8s_postgres_init_sync
	@npm run build:packages
	@npm run lint
	@npm run build:apps
	@npm run i18n:validate
	@npm run type-check
	@npm run security:check
	@$(MAKE) test_deps
	@npm run test
	@echo "============================================"
	@echo "  All CI checks passed!"
	@echo "============================================"

# Ensure Postgres, Valkey, and Mailpit are running and both main and management test DBs exist. Run this before npm run test or e2e_test_report.
# Note: Both databases live in the same Postgres container (metaboost_test_postgres). There is no separate management DB container.
# Mailpit (SMTP 1025, web UI 8025) is used by E2E signup-enabled runs; e2e_mailpit_up is idempotent.
test_deps: test_postgres_up test_valkey_up test_db_init test_db_init_management e2e_mailpit_up
	@echo "Test dependencies ready: main DB $(TEST_DB_NAME), management DB $(TEST_MANAGEMENT_DB_NAME), Mailpit (E2E signup)."

# List test databases inside the running Postgres container (confirms both main and management DBs exist).
test_db_list: test_postgres_up
	@echo "Databases in $(TEST_PG_CONTAINER):"
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d postgres -c "SELECT datname FROM pg_database WHERE datname IN ('$(TEST_DB_NAME)', '$(TEST_MANAGEMENT_DB_NAME)') ORDER BY datname;"

# Start Postgres on port $(TEST_DB_PORT) for tests (idempotent).
test_postgres_up:
	@if docker ps -q -f name=^/$(TEST_PG_CONTAINER)$$ | grep -q .; then \
		echo "Test Postgres already running ($(TEST_PG_CONTAINER))."; \
	elif docker ps -aq -f name=^/$(TEST_PG_CONTAINER)$$ | grep -q .; then \
		echo "Starting existing test Postgres container..."; \
		docker start $(TEST_PG_CONTAINER); \
		echo "Waiting for Postgres to be ready..."; \
		for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do \
			if docker exec $(TEST_PG_CONTAINER) pg_isready -U $(TEST_PG_USER) >/dev/null 2>&1; then break; fi; \
			sleep 1; \
			if [ $$i -eq 20 ]; then echo "Postgres did not become ready (run: docker logs $(TEST_PG_CONTAINER))."; exit 1; fi; \
		done; \
		echo "Test Postgres ready on port $(TEST_DB_PORT)."; \
	else \
		echo "Starting test Postgres on port $(TEST_DB_PORT)..."; \
		docker run -d --name $(TEST_PG_CONTAINER) \
			-p 127.0.0.1:$(TEST_DB_PORT):5432 \
			-e POSTGRES_USER=$(TEST_PG_USER) \
			-e POSTGRES_PASSWORD=$(TEST_PG_PASSWORD) \
			postgres:18.3 \
		|| (echo "If bind failed: Metaboost dev uses 5532; test uses $(TEST_DB_PORT). Check docker ps and free the port or set TEST_DB_PORT."; exit 1); \
		echo "Waiting for Postgres to be ready..."; \
		for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do \
			if docker exec $(TEST_PG_CONTAINER) pg_isready -U $(TEST_PG_USER) >/dev/null 2>&1; then break; fi; \
			sleep 1; \
			if [ $$i -eq 20 ]; then echo "Postgres did not become ready (run: docker logs $(TEST_PG_CONTAINER))."; exit 1; fi; \
		done; \
		echo "Test Postgres ready on port $(TEST_DB_PORT)."; \
	fi

# Start Valkey on port $(TEST_KEYVALDB_PORT) for tests.
# Recreate the test container each run so auth mode is deterministic (`--requirepass test`),
# matching apps/api test env KEYVALDB_PASSWORD and avoiding stale local container config drift.
test_valkey_up:
	@echo "Recreating test Valkey container ($(TEST_VALKEY_CONTAINER)) with requirepass for deterministic auth...";
	@docker rm -f $(TEST_VALKEY_CONTAINER) 2>/dev/null || true
	@docker run -d --name $(TEST_VALKEY_CONTAINER) \
		-p 127.0.0.1:$(TEST_KEYVALDB_PORT):6379 \
		valkey/valkey:7-alpine valkey-server --requirepass test \
	|| (echo "If bind failed: Metaboost dev uses 6479; test uses $(TEST_KEYVALDB_PORT). Check docker ps and free the port or set TEST_KEYVALDB_PORT."; exit 1)
	@echo "Waiting for Valkey to be ready..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if docker exec $(TEST_VALKEY_CONTAINER) valkey-cli -a test ping 2>/dev/null | grep -q PONG; then break; fi; \
		sleep 1; \
		if [ $$i -eq 10 ]; then echo "Valkey did not become ready with test auth (run: docker logs $(TEST_VALKEY_CONTAINER))."; exit 1; fi; \
	done
	@echo "Test Valkey ready on port $(TEST_KEYVALDB_PORT) with password auth."

# Create metaboost_app_test database, apply schema migration chain, create app DB users and grants.
# Drops and recreates the test DB each time so the schema matches current app migration shape.
# Uses docker exec so host does not need psql installed.
test_db_init: test_postgres_up
	@echo "Creating test database and users..."
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(TEST_DB_NAME)' AND pid <> pg_backend_pid();" 2>/dev/null || true
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d postgres -c "DROP DATABASE IF EXISTS $(TEST_DB_NAME);"
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d postgres -c "CREATE DATABASE $(TEST_DB_NAME);"
	@cat infra/k8s/base/db/source/app/0001_app_schema.sql | docker exec -i $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d $(TEST_DB_NAME)
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d postgres -c "DO \$$$$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metaboost_app_read') THEN CREATE USER metaboost_app_read WITH PASSWORD 'test'; END IF; IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metaboost_app_read_write') THEN CREATE USER metaboost_app_read_write WITH PASSWORD 'test'; END IF; END \$$$$;"
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d $(TEST_DB_NAME) -c " \
		GRANT CONNECT ON DATABASE $(TEST_DB_NAME) TO metaboost_app_read, metaboost_app_read_write; \
		GRANT USAGE ON SCHEMA public TO metaboost_app_read, metaboost_app_read_write; \
		GRANT SELECT ON ALL TABLES IN SCHEMA public TO metaboost_app_read; \
		GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO metaboost_app_read; \
		GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO metaboost_app_read_write; \
		GRANT SELECT, USAGE, UPDATE ON ALL SEQUENCES IN SCHEMA public TO metaboost_app_read_write; \
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metaboost_app_read; \
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO metaboost_app_read; \
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO metaboost_app_read_write; \
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, USAGE, UPDATE ON SEQUENCES TO metaboost_app_read_write;"
	@echo "Test database $(TEST_DB_NAME) and users ready."

# Create metaboost_management_test database and apply management schema. Requires test_db_init (app users).
# Creates management DB users (metaboost_management_read, metaboost_management_read_write) and grants.
# Used by apps/management-api integration tests. Same Postgres instance as main test DB; separate database for isolation.
test_db_init_management: test_db_init
	@echo "Creating management test database..."
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(TEST_MANAGEMENT_DB_NAME)' AND pid <> pg_backend_pid();" 2>/dev/null || true
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d postgres -c "DROP DATABASE IF EXISTS $(TEST_MANAGEMENT_DB_NAME);"
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d postgres -c "CREATE DATABASE $(TEST_MANAGEMENT_DB_NAME);"
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d postgres -c "DO \$$$$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metaboost_management_read') THEN CREATE USER metaboost_management_read WITH PASSWORD 'test'; END IF; IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'metaboost_management_read_write') THEN CREATE USER metaboost_management_read_write WITH PASSWORD 'test'; END IF; END \$$$$;"
	@cat infra/k8s/base/db/source/management/0001_management_schema.sql | docker exec -i $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d $(TEST_MANAGEMENT_DB_NAME)
	@docker exec $(TEST_PG_CONTAINER) psql -U $(TEST_PG_USER) -d $(TEST_MANAGEMENT_DB_NAME) -c " \
		GRANT CONNECT ON DATABASE $(TEST_MANAGEMENT_DB_NAME) TO metaboost_management_read, metaboost_management_read_write; \
		GRANT USAGE ON SCHEMA public TO metaboost_management_read, metaboost_management_read_write; \
		GRANT SELECT ON ALL TABLES IN SCHEMA public TO metaboost_management_read; \
		GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO metaboost_management_read; \
		GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO metaboost_management_read_write; \
		GRANT SELECT, USAGE, UPDATE ON ALL SEQUENCES IN SCHEMA public TO metaboost_management_read_write; \
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO metaboost_management_read; \
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO metaboost_management_read; \
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO metaboost_management_read_write; \
		ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, USAGE, UPDATE ON SEQUENCES TO metaboost_management_read_write;"
	@echo "Management test database $(TEST_MANAGEMENT_DB_NAME) ready."

# Stop and remove test Postgres, Valkey, and E2E Mailpit containers. Idempotent.
# E2E Mailpit is defined in infra/docker/e2e/docker-compose.yml; down removes it so no lingering containers.
test_clean:
	@docker rm -f $(TEST_PG_CONTAINER) 2>/dev/null || true
	@docker rm -f $(TEST_VALKEY_CONTAINER) 2>/dev/null || true
	@docker compose -f infra/docker/e2e/docker-compose.yml --project-directory . down 2>/dev/null || true
	@echo "Test containers removed (Postgres, Valkey, E2E Mailpit)."

# Print instructions for meeting test requirements.
help_test:
	@echo "Test requirements: Postgres on port $(TEST_DB_PORT) and Valkey on port $(TEST_KEYVALDB_PORT), with databases $(TEST_DB_NAME) and $(TEST_MANAGEMENT_DB_NAME), and DB users metaboost_app_read, metaboost_app_read_write, metaboost_management_read, metaboost_management_read_write."
	@echo ""
	@echo "Both databases live in the SAME Postgres container ($(TEST_PG_CONTAINER)). You will not see a separate 'management database' container in docker ps."
	@echo "To verify both DBs exist after make test_deps, run:  make test_db_list"
	@echo ""
	@echo "From repo root, run:"
	@echo "  make test_deps"
	@echo ""
	@echo "This will:"
	@echo "  1. Start Postgres in a container on port $(TEST_DB_PORT) (if not already running)."
	@echo "  2. Start Valkey in a container on port $(TEST_KEYVALDB_PORT) (if not already running)."
	@echo "  3. Drop and recreate $(TEST_DB_NAME), apply infra/k8s/base/db/source/app/0001_app_schema.sql, and create metaboost_app_read/metaboost_app_read_write users."
	@echo "  4. Drop and recreate $(TEST_MANAGEMENT_DB_NAME), apply infra/k8s/base/db/source/management/0001_management_schema.sql (for management-api tests)."
	@echo "     (Recreating ensures test DB schemas stay in sync with migrations.)"
	@echo "  5. Start Mailpit (SMTP 1025, web UI 8025) for E2E signup-enabled runs (idempotent)."
	@echo ""
	@echo "Then run:  npm run test   (or make e2e_test_report for full E2E including signup path)."
	@echo ""
	@echo "make test_clean also stops and removes the E2E Mailpit service."
