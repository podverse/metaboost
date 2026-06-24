#!/usr/bin/env bash
# Trigger the full Metaboost ops DB schema reset sequence in Kubernetes (one CronJob per step).
#
# Use when linear_migration_history checksums disagree with current migration files (e.g. after
# editing already-applied SQL on a non-greenfield database). Destructive: drops public schema on
# app and management databases.
#
# Prerequisites:
# - kubectl context targets the intended cluster/namespace
# - ops overlay synced (suspended CronJobs present)
# - metaboost-db Running
#
# Usage:
#   export K8S_NAMESPACE=metaboost-alpha
#   bash scripts/database/run-ops-db-schema-reset-k8s.sh
#
# Each step creates a Job from the matching CronJob and waits for completion (default 15m timeout).

set -euo pipefail

NAMESPACE="${K8S_NAMESPACE:-}"
WAIT_TIMEOUT="${OPS_DB_RESET_WAIT_TIMEOUT:-900s}"

if [[ -z "$NAMESPACE" ]]; then
  echo "ERROR: K8S_NAMESPACE must be set (e.g. export K8S_NAMESPACE=metaboost-alpha)." >&2
  exit 1
fi

CRONJOBS=(
  metaboost-db-drop-everything
  metaboost-db-rebootstrap-roles
  metaboost-db-migrate-app
  metaboost-db-migrate-management
  metaboost-db-verify-bootstrap-contract
  metaboost-management-superuser-create
)

run_cronjob_step() {
  local cronjob="$1"
  local job_name="${cronjob}-manual-$(date +%s)"

  echo "==> Creating job ${job_name} from cronjob/${cronjob}"
  kubectl -n "$NAMESPACE" create job --from="cronjob/${cronjob}" "$job_name"

  echo "==> Waiting for job/${job_name} (timeout ${WAIT_TIMEOUT})"
  if ! kubectl -n "$NAMESPACE" wait --for=condition=complete "job/${job_name}" --timeout="$WAIT_TIMEOUT"; then
    echo "ERROR: job/${job_name} did not complete successfully." >&2
    kubectl -n "$NAMESPACE" logs "job/${job_name}" --tail=80 || true
    exit 1
  fi

  kubectl -n "$NAMESPACE" logs "job/${job_name}" --tail=40
  echo ""
}

echo "Metaboost ops DB schema reset in namespace: ${NAMESPACE}"
echo "Steps: ${CRONJOBS[*]}"
echo ""

for cronjob in "${CRONJOBS[@]}"; do
  run_cronjob_step "$cronjob"
done

echo "Schema reset sequence completed."
echo "Next: rollout restart deployment/api deployment/management-api (and web tiers if needed)."
