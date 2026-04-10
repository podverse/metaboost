.PHONY: local_k3d_up local_k3d_down local_argocd_port_forward local_k3d_status local_k3d_postgres_reset sync_k8s_postgres_init check_k8s_postgres_init_sync

# Copy canonical postgres-init from stack to db (Kustomize load restrictor). Canonical SQL is only under stack/db k8s trees; run combine-migrations.sh to regenerate from migrations.
sync_k8s_postgres_init:
	mkdir -p infra/k8s/base/db/postgres-init
	cp infra/k8s/base/stack/postgres-init/0003_app_schema.sql infra/k8s/base/db/postgres-init/0003_app_schema.sql
	cp infra/k8s/base/stack/postgres-init/0005_management_schema.sql.frag infra/k8s/base/db/postgres-init/0005_management_schema.sql.frag
	cp infra/k8s/base/stack/postgres-init/*.sh infra/k8s/base/db/postgres-init/
	chmod +x infra/k8s/base/db/postgres-init/*.sh

# Fail if stack/db postgres-init copies differ or migrations do not match committed k8s SQL.
check_k8s_postgres_init_sync:
	@diff -q infra/k8s/base/stack/postgres-init/0003_app_schema.sql infra/k8s/base/db/postgres-init/0003_app_schema.sql >/dev/null || \
	  (echo "ERROR: stack vs db 0003_app_schema.sql differ. Run: make sync_k8s_postgres_init or scripts/database/combine-migrations.sh"; exit 1)
	@diff -q infra/k8s/base/stack/postgres-init/0005_management_schema.sql.frag infra/k8s/base/db/postgres-init/0005_management_schema.sql.frag >/dev/null || \
	  (echo "ERROR: stack vs db 0005_management_schema.sql.frag differ. Run: make sync_k8s_postgres_init or scripts/database/combine-migrations.sh"; exit 1)
	@diff -qr infra/k8s/base/stack/postgres-init infra/k8s/base/db/postgres-init >/dev/null || \
	  (echo "ERROR: stack postgres-init and db/postgres-init differ. Run: make sync_k8s_postgres_init or scripts/database/combine-migrations.sh"; exit 1)
	@bash scripts/database/verify-migrations-combined.sh
	@echo "Postgres-init SQL and stack/db copies in sync; migrations match k8s 0003/0005 combined files."

local_k3d_up: sync_k8s_postgres_init
	bash scripts/infra/k3d/local-up.sh

local_k3d_down:
	bash scripts/infra/k3d/local-down.sh

# Delete Postgres PVC and pod so on next start the data dir is empty and init runs again with current secrets.
# Use when API fails with "password authentication failed for user boilerplate_app_read" (secrets were updated after Postgres was initialized).
# Requires the k3d cluster to be up (run make local_k3d_up first).
local_k3d_postgres_reset:
	@if ! k3d cluster list 2>/dev/null | grep -q "boilerplate-local"; then \
		echo "ERROR: local_k3d_postgres_reset requires the k3d cluster to be running."; \
		echo "Bring up the cluster first: make local_k3d_up"; \
		exit 1; \
	fi
	@echo "Scaling postgres down to detach volume..."
	kubectl -n boilerplate-local scale deployment postgres --replicas=0
	@echo "Waiting for postgres pod to terminate (max 90s)..."
	-kubectl -n boilerplate-local wait --for=delete pod -l app=postgres --timeout=90s
	@echo "Deleting postgres PVC..."
	kubectl -n boilerplate-local delete pvc boilerplate-postgres-data --ignore-not-found
	@echo "Waiting for postgres PVC deletion (max 120s)..."
	-kubectl -n boilerplate-local wait --for=delete pvc/boilerplate-postgres-data --timeout=120s
	@echo "Recreating postgres PVC..."
	kubectl apply -f infra/k8s/base/stack/pvc.yaml
	@echo "Waiting for postgres PVC to bind (max 120s)..."
	kubectl -n boilerplate-local wait --for=jsonpath='{.status.phase}'=Bound pvc/boilerplate-postgres-data --timeout=120s
	@echo "Scaling postgres back up..."
	kubectl -n boilerplate-local scale deployment postgres --replicas=1
	@echo "Waiting for postgres rollout (max 180s)..."
	kubectl -n boilerplate-local rollout status deployment/postgres --timeout=180s
	@echo "Postgres reset complete. Init scripts re-ran on fresh storage. Restart API services: kubectl -n boilerplate-local rollout restart deployment api management-api"

local_argocd_port_forward:
	kubectl -n argocd port-forward svc/argocd-server 8080:443

local_k3d_status:
	kubectl -n boilerplate-local get pods,svc
