# --- Pre-push validation and Docker image build. ---

.PHONY: validate validate_docker

# Pre-push validation: audit, build packages, lint, type-check, env setup, build apps (plan 05).
# Step 2 builds packages (helpers, orm); step 6 builds apps (api, web, sidecar). Exits non-zero on first failure.
validate:
	@echo "============================================"
	@echo "  Running Pre-Push Validation"
	@echo "============================================"
	@echo ""
	@echo "Step 1/7: Security audit..."
	npm audit --omit=dev
	@echo ""
	@echo "Step 2/7: Env classification (validate-parity)..."
	@bash scripts/env-classification/validate-parity.sh
	@echo ""
	@echo "Step 3/7: Building packages..."
	npm run build:packages
	@echo ""
	@echo "Step 4/7: Linting..."
	npm run lint
	@echo ""
	@echo "Step 5/7: Type checking..."
	npm run type-check
	@echo ""
	@echo "Step 6/7: Setting up env for web (Next.js .env.local)..."
	@test -f apps/web/.env.local || ruby scripts/env-classification/boilerplate-env.rb merge-env --profile dev --group web --output apps/web/.env.local
	@echo "  (apps/web/.env.local from classification if missing)"
	@echo ""
	@echo "Step 7/7: Building apps..."
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
	@echo "Building boilerplate-api..."
	docker build -f infra/docker/local/api/Dockerfile -t boilerplate-api:test .
	@echo ""
	@echo "Building boilerplate-management-api..."
	docker build -f infra/docker/local/management-api/Dockerfile -t boilerplate-management-api:test .
	@echo ""
	@echo "Building boilerplate-web..."
	docker build -f infra/docker/local/web/Dockerfile -t boilerplate-web:test .
	@echo ""
	@echo "Building boilerplate-web-sidecar..."
	docker build -f infra/docker/local/web-sidecar/Dockerfile -t boilerplate-web-sidecar:test .
	@echo ""
	@echo "Building boilerplate-management-web..."
	docker build -f infra/docker/local/management-web/Dockerfile -t boilerplate-management-web:test .
	@echo ""
	@echo "Building boilerplate-management-web-sidecar..."
	docker build -f infra/docker/local/management-web-sidecar/Dockerfile -t boilerplate-management-web-sidecar:test .
	@echo ""
	@echo "============================================"
	@echo "  All Docker images built successfully!"
	@echo "============================================"
