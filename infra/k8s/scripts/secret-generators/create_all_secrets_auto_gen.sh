#!/usr/bin/env bash
# Run Metaboost secret generators that support --auto-gen (plus optional mailer placeholders).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENT="${1:-alpha}"

AUTO_GEN_SCRIPTS=(
  "create_api_secret.sh"
  "create_management_api_secret.sh"
  "create_db_secret.sh"
  "create_keyvaldb_secret.sh"
  "create_mailer_secret.sh"
)

OUTPUT_FILES=(
  "./secrets/metaboost-${ENVIRONMENT}-api-secrets.enc.yaml"
  "./secrets/metaboost-${ENVIRONMENT}-management-api-secrets.enc.yaml"
  "./secrets/metaboost-${ENVIRONMENT}-db-secrets.enc.yaml"
  "./secrets/metaboost-${ENVIRONMENT}-keyvaldb-secrets.enc.yaml"
  "./secrets/metaboost-${ENVIRONMENT}-mailer-opaque.enc.yaml"
)

MANUAL_SCRIPTS=(
  "create_github_registry_secret.sh (GitHub username + PAT read:packages for ghcr.io)"
  "create_cloudflared_tunnel_secret.sh (Cloudflare Tunnel token; Secret cloudflared-tunnel-secret in external-infra)"
  "check_db_secret_contract.sh ${ENVIRONMENT} (after DB secret exists)"
)

CREATED_FILES=()

echo "===================================================="
echo "Metaboost auto-gen secret scripts"
echo "Environment: ${ENVIRONMENT}"
echo "===================================================="

for i in "${!AUTO_GEN_SCRIPTS[@]}"; do
  script_name="${AUTO_GEN_SCRIPTS[$i]}"
  output_file="${OUTPUT_FILES[$i]}"
  script_path="${SCRIPT_DIR}/${script_name}"

  if [ ! -f "${script_path}" ]; then
    echo "WARNING: missing script, skipping: ${script_name}"
    continue
  fi

  echo "----------------------------------------------------"
  echo "Running ${script_name}"
  bash "${script_path}" --auto-gen --output-file "${output_file}" "${ENVIRONMENT}"
  CREATED_FILES+=("${output_file}")
done

echo ""
echo "Auto-gen complete."
echo ""

echo "Verify:"
for f in "${CREATED_FILES[@]}"; do
  echo "  sops -d ${f}"
done

echo ""
echo "Apply:"
for f in "${CREATED_FILES[@]}"; do
  echo "  sops -d ${f} | kubectl apply -f -"
done

echo ""
echo "Run manually when external credentials are required:"
for entry in "${MANUAL_SCRIPTS[@]}"; do
  echo "  - ${entry}"
done
