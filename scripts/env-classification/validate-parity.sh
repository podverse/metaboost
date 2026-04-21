#!/usr/bin/env bash
# Smoke-test: classification YAML merges and metaboost-env CLI for every env group/profile used in CI and local setup.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

bash scripts/k8s-env/validate-classification.sh

RUBY="${METABOOST_ENV_RUBY:-ruby}"

profiles=(dev local_docker local_k8s remote_k8s)
env_groups=(db valkey locale mailer auth info api web-sidecar web management-api management-web-sidecar management-web)

for profile in "${profiles[@]}"; do
  for group in "${env_groups[@]}"; do
    "$RUBY" scripts/env-classification/metaboost-env.rb merge-env \
      --profile "$profile" \
      --group "$group" >/dev/null
  done
done

bash "$SCRIPT_DIR/validate-env-vars-catalog.sh"

echo "validate-parity: OK"
