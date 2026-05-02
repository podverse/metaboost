#!/usr/bin/env bash
# Helper to create an encrypted metaboost keyvaldb secret manifest.

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

generate_password() {
  openssl rand -hex 32 | tr -d '\n'
}

require_cmd kubectl
require_cmd sops
require_cmd openssl

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

SECRET_NAME="metaboost-keyvaldb-secrets"
NAMESPACE="metaboost-${ENVIRONMENT}"
OUTPUT_FILE="./secrets/metaboost-${ENVIRONMENT}-keyvaldb-secrets.enc.yaml"

if [ -n "$OUTPUT_FILE_OVERRIDE" ]; then
  OUTPUT_FILE="$OUTPUT_FILE_OVERRIDE"
fi

if [ "$AUTO_GEN" = true ]; then
  KEYVALDB_PASSWORD="$(generate_password)"
else
  read -r -s -p "Enter KEYVALDB_PASSWORD: " KEYVALDB_PASSWORD
  echo ""
  if [ -z "$KEYVALDB_PASSWORD" ]; then
    echo "Error: KEYVALDB_PASSWORD is required." >&2
    exit 1
  fi
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/metaboost-keyvaldb-secret.XXXXXX")"
TMP_FILE="${TMP_DIR}/metaboost-keyvaldb-secrets.yaml"
trap 'rm -rf "$TMP_DIR"' EXIT

kubectl create secret generic "${SECRET_NAME}" \
  --namespace "${NAMESPACE}" \
  --from-literal=KEYVALDB_PASSWORD="${KEYVALDB_PASSWORD}" \
  --dry-run=client -o yaml >"${TMP_FILE}"

sops --encrypt --encrypted-regex '^(data|stringData)$' \
  --input-type=yaml "${TMP_FILE}" >"${OUTPUT_FILE}"

echo "SUCCESS: ${OUTPUT_FILE}"
echo "Verify: sops -d ${OUTPUT_FILE}"
echo "Apply:  sops -d ${OUTPUT_FILE} | kubectl apply -f -"
