# --- Pre-push validation and Docker image build. ---

.PHONY: validate validate_docker
.PHONY: db_run_linear_app db_run_linear_management db_run_linear_dry_app db_run_linear_dry_management
.PHONY: db_status_linear_app db_status_linear_management db_validate_linear db_validate_linear_check_db
.PHONY: db_regen_linear_baseline db_verify_linear_baseline

# Run forward-only linear migrations against local Postgres (app / management).
db_run_linear_app:
	bash scripts/database/run-linear-migrations.sh --database app

db_run_linear_management:
	bash scripts/database/run-linear-migrations.sh --database management

# Show pending migrations without applying them.
db_run_linear_dry_app:
	bash scripts/database/run-linear-migrations.sh --database app --dry-run

db_run_linear_dry_management:
	bash scripts/database/run-linear-migrations.sh --database management --dry-run

# Print applied/pending migration status using the k8s-style status script.
db_status_linear_app:
	MIGRATION_DATABASE=app bash scripts/database/print-linear-migrations-status-k8s.sh

db_status_linear_management:
	MIGRATION_DATABASE=management bash scripts/database/print-linear-migrations-status-k8s.sh

# Validate migration naming/order + ops bundle sync, optionally against live DB checksums.
db_validate_linear:
	bash scripts/database/validate-linear-migrations.sh

db_validate_linear_check_db:
	bash scripts/database/validate-linear-migrations.sh --check-db

# Regenerate and verify baseline artifacts used by db bootstrap.
db_regen_linear_baseline:
	bash scripts/database/generate-linear-baseline.sh

db_verify_linear_baseline:
	bash scripts/database/verify-linear-baseline.sh

# Pre-push validation: audit, build packages, lint, type-check, env setup, build apps (plan 05).
# Step 2 builds packages (helpers, orm); step 6 builds apps (api, web, sidecar). Exits non-zero on first failure.
validate:
	@echo "============================================"
	@echo "  Running Pre-Push Validation"
	@echo "============================================"
	@echo ""
	@echo "Step 1/6: Security audit (moderate and above; low permitted)..."
	npm audit --omit=dev --audit-level=moderate
	@echo ""
	@echo "Step 2/6: Building packages..."
	npm run build:packages
	@echo ""
	@echo "Step 3/6: Linting..."
	npm run lint
	@echo ""
	@echo "Step 4/6: Type checking..."
	npm run type-check
	@echo ""
	@echo "Step 5/6: Preparing local env files for web build..."
	@test -f apps/web/.env.local || cp apps/web/.env.example apps/web/.env.local
	@echo "  (apps/web/.env.local from apps/web/.env.example if missing)"
	@echo ""
	@echo "Step 6/6: Building apps..."
	npm run build:apps
	@echo ""
	@echo "============================================"
	@echo "  All checks passed!"
	@echo "============================================"

# Optional: after validate, build Docker images with the same Dockerfiles CI uses for staging publish.
# Uses infra/docker/local/* Dockerfiles for api, management-api, web, web-sidecar,
# management-web, and management-web-sidecar.
validate_docker: validate
	@echo ""
	@echo "============================================"
	@echo "  Building Docker Images (Local Test)"
	@echo "============================================"
	@echo ""
	@echo "Building metaboost-api..."
	docker build -f infra/docker/local/api/Dockerfile -t metaboost-api:test .
	@echo ""
	@echo "Building metaboost-management-api..."
	docker build -f infra/docker/local/management-api/Dockerfile -t metaboost-management-api:test .
	@echo ""
	@echo "Building metaboost-web..."
	docker build -f infra/docker/local/web/Dockerfile -t metaboost-web:test .
	@echo ""
	@echo "Building metaboost-web-sidecar..."
	docker build -f infra/docker/local/web-sidecar/Dockerfile -t metaboost-web-sidecar:test .
	@echo ""
	@echo "Building metaboost-management-web..."
	docker build -f infra/docker/local/management-web/Dockerfile -t metaboost-management-web:test .
	@echo ""
	@echo "Building metaboost-management-web-sidecar..."
	docker build -f infra/docker/local/management-web-sidecar/Dockerfile -t metaboost-management-web-sidecar:test .
	@echo ""
	@echo "============================================"
	@echo "  All Docker images built successfully!"
	@echo "============================================"
