#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

NAMESPACE="${K8S_NAMESPACE:-metaboost-local}"

# kubectl --from-env-file does NOT strip surrounding quotes from values.
# The repo convention uses double-quoted values (PORT="4001"), but kubectl
# would store the literal string "4001" (with quotes). This helper creates
# a temp copy with quotes stripped so the secret values are clean.
strip_quotes_env() {
  local src="$1"
  local tmp
  tmp=$(mktemp)
  sed -E 's/^([A-Za-z_][A-Za-z0-9_]*)="(.*)"/\1=\2/' "$src" > "$tmp"
  echo "$tmp"
}

create_secret() {
  local name="$1"
  local env_file="$2"
  local stripped
  stripped=$(strip_quotes_env "$env_file")
  kubectl -n "$NAMESPACE" create secret generic "$name" \
    --from-env-file="$stripped" \
    --dry-run=client -o yaml | kubectl apply -f -
  rm -f "$stripped"
}

# Merge env files (later keys win) then create one secret (same idea as scripts/k8s-env/lib/env-merge.sh).
create_secret_from_files() {
  local name="$1"
  shift
  local merged
  merged=$(mktemp)
  cat "$@" >"$merged"
  create_secret "$name" "$merged"
  rm -f "$merged"
}

kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

create_secret_from_files metaboost-db-secrets infra/config/local/db.env
create_secret metaboost-valkey-secrets infra/config/local/valkey.env
create_secret metaboost-api-secrets infra/config/local/api.env
create_secret metaboost-management-api-secrets infra/config/local/management-api.env
create_secret metaboost-web-secrets infra/config/local/web.env
create_secret metaboost-web-sidecar-secrets infra/config/local/web-sidecar.env
create_secret metaboost-management-web-secrets infra/config/local/management-web.env
create_secret metaboost-management-web-sidecar-secrets infra/config/local/management-web-sidecar.env

echo "Applied local Kubernetes secrets from infra/config/local/*.env"
