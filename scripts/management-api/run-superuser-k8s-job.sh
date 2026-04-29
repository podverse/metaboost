#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-}"
NAMESPACE="${K8S_NAMESPACE:-metaboost-local}"

if [[ "$ACTION" != "create" && "$ACTION" != "update" ]]; then
  echo "Usage: bash scripts/management-api/run-superuser-k8s-job.sh <create|update>"
  exit 1
fi

CRONJOB_NAME="metaboost-management-superuser-${ACTION}"
JOB_NAME="${CRONJOB_NAME}-manual-$(date +%s)"

kubectl -n "$NAMESPACE" create job --from="cronjob/${CRONJOB_NAME}" "$JOB_NAME"

echo "Created job: ${JOB_NAME}"
echo "Next step: kubectl -n ${NAMESPACE} logs -f job/${JOB_NAME}"
