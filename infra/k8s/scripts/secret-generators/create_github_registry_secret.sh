#!/usr/bin/env bash
# Helper to create an encrypted GHCR docker-registry pull secret manifest.

set -euo pipefail

OUTPUT_FILE_OVERRIDE=""

while [ "$#" -gt 0 ]; do
  case "$1" in
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
else
  read -r -p "Enter environment [alpha]: " ENVIRONMENT
  ENVIRONMENT="${ENVIRONMENT:-alpha}"
fi

SECRET_NAME="github-registry-secret"
NAMESPACE="metaboost-${ENVIRONMENT}"
OUTPUT_FILE="./secrets/metaboost-${ENVIRONMENT}-github-registry-secret.enc.yaml"

if [ -n "$OUTPUT_FILE_OVERRIDE" ]; then
  OUTPUT_FILE="$OUTPUT_FILE_OVERRIDE"
fi

echo "GitHub username (owner of PAT with read:packages):"
read -r GITHUB_USERNAME
if [ -z "$GITHUB_USERNAME" ]; then
  echo "Error: GitHub username is required." >&2
  exit 1
fi

echo "GitHub PAT (classic, read:packages) - input hidden:"
read -r -s GITHUB_TOKEN
echo ""
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GitHub PAT is required." >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/metaboost-ghcr-secret.XXXXXX")"
TMP_FILE="${TMP_DIR}/github-registry-secret.yaml"
trap 'rm -rf "$TMP_DIR"' EXIT

kubectl create secret docker-registry "${SECRET_NAME}" \
  --docker-server="ghcr.io" \
  --docker-username="${GITHUB_USERNAME}" \
  --docker-password="${GITHUB_TOKEN}" \
  --docker-email="unused@example.com" \
  --namespace "${NAMESPACE}" \
  --dry-run=client -o yaml >"${TMP_FILE}"

sops --encrypt --encrypted-regex '^(data|stringData)$' \
  --input-type=yaml "${TMP_FILE}" >"${OUTPUT_FILE}"

echo "SUCCESS: ${OUTPUT_FILE}"
echo "Verify: sops -d ${OUTPUT_FILE}"
echo "Apply:  sops -d ${OUTPUT_FILE} | kubectl apply -f -"
