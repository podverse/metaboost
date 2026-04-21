.PHONY: local_k3d_up local_k3d_down local_argocd_port_forward local_k3d_status local_k3d_postgres_reset sync_k8s_postgres_init check_k8s_postgres_init_sync

# Canonical postgres-init source is infra/k8s/base/db/postgres-init.
sync_k8s_postgres_init:
	@echo "sync_k8s_postgres_init: no-op (base/db is canonical)."

# Fail if canonical postgres-init verification fails.
check_k8s_postgres_init_sync:
	@bash scripts/database/verify-migrations-combined.sh
	@echo "Canonical postgres-init verification passed."

local_k3d_up: sync_k8s_postgres_init
	bash scripts/infra/k3d/local-up.sh

local_k3d_down:
	bash scripts/infra/k3d/local-down.sh

# Delete Postgres PVC and pod so on next start the data dir is empty and init runs again with current secrets.
# Use when API fails with "password authentication failed for user metaboost_app_read" (secrets were updated after Postgres was initialized).
# Requires the k3d cluster to be up (run make local_k3d_up first).
local_k3d_postgres_reset:
	@if ! k3d cluster list 2>/dev/null | grep -q "metaboost-local"; then \
		echo "ERROR: local_k3d_postgres_reset requires the k3d cluster to be running."; \
		echo "Bring up the cluster first: make local_k3d_up"; \
		exit 1; \
	fi
	@echo "Scaling postgres down to detach volume..."
	kubectl -n metaboost-local scale deployment postgres --replicas=0
	@echo "Waiting for postgres pod to terminate (max 90s)..."
	-kubectl -n metaboost-local wait --for=delete pod -l app=postgres --timeout=90s
	@echo "Deleting postgres PVC..."
	kubectl -n metaboost-local delete pvc metaboost-postgres-data --ignore-not-found
	@echo "Waiting for postgres PVC deletion (max 120s)..."
	-kubectl -n metaboost-local wait --for=delete pvc/metaboost-postgres-data --timeout=120s
	@echo "Recreating postgres PVC..."
	kubectl apply -f infra/k8s/base/stack/pvc.yaml
	@echo "Waiting for postgres PVC to bind (max 120s)..."
	kubectl -n metaboost-local wait --for=jsonpath='{.status.phase}'=Bound pvc/metaboost-postgres-data --timeout=120s
	@echo "Scaling postgres back up..."
	kubectl -n metaboost-local scale deployment postgres --replicas=1
	@echo "Waiting for postgres rollout (max 180s)..."
	kubectl -n metaboost-local rollout status deployment/postgres --timeout=180s
	@echo "Postgres reset complete. Init scripts re-ran on fresh storage. Restart API services: kubectl -n metaboost-local rollout restart deployment api management-api"

local_argocd_port_forward:
	kubectl -n argocd port-forward svc/argocd-server 8080:443

local_k3d_status:
	kubectl -n metaboost-local get pods,svc
