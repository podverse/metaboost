#!/usr/bin/env bash
# Encrypted Secret for SMTP credentials (MAILER_USERNAME / MAILER_PASSWORD).
# Separate from metaboost-api-secrets (AUTH_JWT_SECRET only). See create_api_secret.sh.

set -euo pipefail

AUTO_GEN=false
OUTPUT_FILE_OVERRIDE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --auto-gen)
      AUTO_GEN=true
      shift
      ;;
    --output-file)
      OUTPUT_FILE_OVERRIDE="${2:?--output-file requires a value}"
      shift 2
      ;;
    *)
      break
      ;;
  esac
done

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command not found: $1" >&2
    exit 1
  fi
}

require_cmd kubectl
require_cmd sops

ENVIRONMENT_ARG="${1:-}"

if [ -n "$ENVIRONMENT_ARG" ]; then
  ENVIRONMENT="$ENVIRONMENT_ARG"
elif [ "$AUTO_GEN" = true ]; then
  ENVIRONMENT="alpha"
  echo "Auto-generating with environment: ${ENVIRONMENT}"
else
  read -r -p "Enter environment [alpha]: " ENVIRONMENT
fi
ENVIRONMENT="${ENVIRONMENT:-alpha}"

SECRET_NAME="metaboost-mailer-opaque"
NAMESPACE="metaboost-${ENVIRONMENT}"
OUTPUT_FILE="./secrets/metaboost-${ENVIRONMENT}-mailer-opaque.enc.yaml"

if [ -n "$OUTPUT_FILE_OVERRIDE" ]; then
  OUTPUT_FILE="$OUTPUT_FILE_OVERRIDE"
fi

if [ "$AUTO_GEN" = true ]; then
  MAILER_USERNAME=""
  MAILER_PASSWORD=""
  echo "  MAILER_USERNAME: [empty—re-run without --auto-gen to set]"
  echo "  MAILER_PASSWORD: [empty—re-run without --auto-gen to set]"
else
  echo "--- Mailer (optional: leave blank if not using outbound SMTP) ---"
  read -r -p "Enter MAILER_USERNAME: " MAILER_USERNAME
  read -r -s -p "Enter MAILER_PASSWORD: " MAILER_PASSWORD
  echo ""
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/metaboost-mailer-secret.XXXXXX")"
TMP_FILE="${TMP_DIR}/metaboost-mailer-opaque.yaml"
trap 'rm -rf "$TMP_DIR"' EXIT

kubectl create secret generic "${SECRET_NAME}" \
  --namespace "${NAMESPACE}" \
  --from-literal=MAILER_USERNAME="${MAILER_USERNAME}" \
  --from-literal=MAILER_PASSWORD="${MAILER_PASSWORD}" \
  --dry-run=client -o yaml >"${TMP_FILE}"

sops --encrypt --encrypted-regex '^(data|stringData)$' \
  --input-type=yaml "${TMP_FILE}" >"${OUTPUT_FILE}"

echo "SUCCESS: ${OUTPUT_FILE}"
echo "Verify: sops -d ${OUTPUT_FILE}"
echo "Apply:  sops -d ${OUTPUT_FILE} | kubectl apply -f -"
