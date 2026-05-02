#!/usr/bin/env bash
# Helper to create an encrypted metaboost DB secret manifest.
# Emits role-based keys only (owner/migrator/read/read_write) for both app and management DBs.

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

SECRET_NAME="metaboost-db-secrets"
NAMESPACE="metaboost-${ENVIRONMENT}"
OUTPUT_FILE="./secrets/metaboost-${ENVIRONMENT}-db-secrets.enc.yaml"

if [ -n "$OUTPUT_FILE_OVERRIDE" ]; then
  OUTPUT_FILE="$OUTPUT_FILE_OVERRIDE"
fi

DEFAULT_DB_APP_NAME="metaboost_app"
DEFAULT_DB_APP_OWNER_USER="metaboost_app_owner"
DEFAULT_DB_APP_MIGRATOR_USER="metaboost_app_migrator"
DEFAULT_DB_APP_READ_USER="metaboost_app_read"
DEFAULT_DB_APP_READ_WRITE_USER="metaboost_app_read_write"

DEFAULT_DB_MANAGEMENT_NAME="metaboost_management"
DEFAULT_DB_MANAGEMENT_OWNER_USER="metaboost_management_owner"
DEFAULT_DB_MANAGEMENT_MIGRATOR_USER="metaboost_management_migrator"
DEFAULT_DB_MANAGEMENT_READ_USER="metaboost_management_read"
DEFAULT_DB_MANAGEMENT_READ_WRITE_USER="metaboost_management_read_write"

if [ "$AUTO_GEN" = true ]; then
  DB_APP_NAME="$DEFAULT_DB_APP_NAME"
  DB_APP_OWNER_USER="$DEFAULT_DB_APP_OWNER_USER"
  DB_APP_MIGRATOR_USER="$DEFAULT_DB_APP_MIGRATOR_USER"
  DB_APP_READ_USER="$DEFAULT_DB_APP_READ_USER"
  DB_APP_READ_WRITE_USER="$DEFAULT_DB_APP_READ_WRITE_USER"
  DB_APP_OWNER_PASSWORD="$(generate_password)"
  DB_APP_MIGRATOR_PASSWORD="$(generate_password)"
  DB_APP_READ_PASSWORD="$(generate_password)"
  DB_APP_READ_WRITE_PASSWORD="$(generate_password)"

  DB_MANAGEMENT_NAME="$DEFAULT_DB_MANAGEMENT_NAME"
  DB_MANAGEMENT_OWNER_USER="$DEFAULT_DB_MANAGEMENT_OWNER_USER"
  DB_MANAGEMENT_MIGRATOR_USER="$DEFAULT_DB_MANAGEMENT_MIGRATOR_USER"
  DB_MANAGEMENT_READ_USER="$DEFAULT_DB_MANAGEMENT_READ_USER"
  DB_MANAGEMENT_READ_WRITE_USER="$DEFAULT_DB_MANAGEMENT_READ_WRITE_USER"
  DB_MANAGEMENT_OWNER_PASSWORD="$(generate_password)"
  DB_MANAGEMENT_MIGRATOR_PASSWORD="$(generate_password)"
  DB_MANAGEMENT_READ_PASSWORD="$(generate_password)"
  DB_MANAGEMENT_READ_WRITE_PASSWORD="$(generate_password)"
  echo "Generated DB credentials for ${NAMESPACE}."
else
  echo "Press Enter to use defaults for non-sensitive fields."
  read -r -p "DB_APP_NAME [${DEFAULT_DB_APP_NAME}]: " input_db_name
  DB_APP_NAME="${input_db_name:-$DEFAULT_DB_APP_NAME}"

  read -r -p "DB_APP_OWNER_USER [${DEFAULT_DB_APP_OWNER_USER}]: " input_owner_user
  DB_APP_OWNER_USER="${input_owner_user:-$DEFAULT_DB_APP_OWNER_USER}"

  read -r -p "DB_APP_MIGRATOR_USER [${DEFAULT_DB_APP_MIGRATOR_USER}]: " input_app_migrator_user
  DB_APP_MIGRATOR_USER="${input_app_migrator_user:-$DEFAULT_DB_APP_MIGRATOR_USER}"

  read -r -p "DB_APP_READ_USER [${DEFAULT_DB_APP_READ_USER}]: " input_read_user
  DB_APP_READ_USER="${input_read_user:-$DEFAULT_DB_APP_READ_USER}"

  read -r -p "DB_APP_READ_WRITE_USER [${DEFAULT_DB_APP_READ_WRITE_USER}]: " input_rw_user
  DB_APP_READ_WRITE_USER="${input_rw_user:-$DEFAULT_DB_APP_READ_WRITE_USER}"

  read -r -s -p "Enter DB_APP_OWNER_PASSWORD: " DB_APP_OWNER_PASSWORD
  echo ""
  read -r -s -p "Enter DB_APP_MIGRATOR_PASSWORD: " DB_APP_MIGRATOR_PASSWORD
  echo ""
  read -r -s -p "Enter DB_APP_READ_PASSWORD: " DB_APP_READ_PASSWORD
  echo ""
  read -r -s -p "Enter DB_APP_READ_WRITE_PASSWORD: " DB_APP_READ_WRITE_PASSWORD
  echo ""

  read -r -p "DB_MANAGEMENT_NAME [${DEFAULT_DB_MANAGEMENT_NAME}]: " input_management_name
  DB_MANAGEMENT_NAME="${input_management_name:-$DEFAULT_DB_MANAGEMENT_NAME}"

  read -r -p "DB_MANAGEMENT_OWNER_USER [${DEFAULT_DB_MANAGEMENT_OWNER_USER}]: " input_management_owner_user
  DB_MANAGEMENT_OWNER_USER="${input_management_owner_user:-$DEFAULT_DB_MANAGEMENT_OWNER_USER}"

  read -r -p "DB_MANAGEMENT_MIGRATOR_USER [${DEFAULT_DB_MANAGEMENT_MIGRATOR_USER}]: " input_management_migrator_user
  DB_MANAGEMENT_MIGRATOR_USER="${input_management_migrator_user:-$DEFAULT_DB_MANAGEMENT_MIGRATOR_USER}"

  read -r -p "DB_MANAGEMENT_READ_USER [${DEFAULT_DB_MANAGEMENT_READ_USER}]: " input_management_read_user
  DB_MANAGEMENT_READ_USER="${input_management_read_user:-$DEFAULT_DB_MANAGEMENT_READ_USER}"

  read -r -p "DB_MANAGEMENT_READ_WRITE_USER [${DEFAULT_DB_MANAGEMENT_READ_WRITE_USER}]: " input_management_rw_user
  DB_MANAGEMENT_READ_WRITE_USER="${input_management_rw_user:-$DEFAULT_DB_MANAGEMENT_READ_WRITE_USER}"

  read -r -s -p "Enter DB_MANAGEMENT_OWNER_PASSWORD: " DB_MANAGEMENT_OWNER_PASSWORD
  echo ""
  read -r -s -p "Enter DB_MANAGEMENT_MIGRATOR_PASSWORD: " DB_MANAGEMENT_MIGRATOR_PASSWORD
  echo ""
  read -r -s -p "Enter DB_MANAGEMENT_READ_PASSWORD: " DB_MANAGEMENT_READ_PASSWORD
  echo ""
  read -r -s -p "Enter DB_MANAGEMENT_READ_WRITE_PASSWORD: " DB_MANAGEMENT_READ_WRITE_PASSWORD
  echo ""

  if [ -z "$DB_APP_OWNER_PASSWORD" ] || [ -z "$DB_APP_MIGRATOR_PASSWORD" ] || [ -z "$DB_APP_READ_PASSWORD" ] || [ -z "$DB_APP_READ_WRITE_PASSWORD" ] || [ -z "$DB_MANAGEMENT_OWNER_PASSWORD" ] || [ -z "$DB_MANAGEMENT_MIGRATOR_PASSWORD" ] || [ -z "$DB_MANAGEMENT_READ_PASSWORD" ] || [ -z "$DB_MANAGEMENT_READ_WRITE_PASSWORD" ]; then
    echo "Error: all DB role passwords are required." >&2
    exit 1
  fi
fi

mkdir -p "$(dirname "$OUTPUT_FILE")"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/metaboost-db-secret.XXXXXX")"
TMP_FILE="${TMP_DIR}/metaboost-db-secrets.yaml"
trap 'rm -rf "$TMP_DIR"' EXIT

kubectl create secret generic "${SECRET_NAME}" \
  --namespace "${NAMESPACE}" \
  --from-literal=DB_APP_NAME="${DB_APP_NAME}" \
  --from-literal=DB_APP_OWNER_USER="${DB_APP_OWNER_USER}" \
  --from-literal=DB_APP_OWNER_PASSWORD="${DB_APP_OWNER_PASSWORD}" \
  --from-literal=DB_APP_MIGRATOR_USER="${DB_APP_MIGRATOR_USER}" \
  --from-literal=DB_APP_MIGRATOR_PASSWORD="${DB_APP_MIGRATOR_PASSWORD}" \
  --from-literal=DB_APP_READ_USER="${DB_APP_READ_USER}" \
  --from-literal=DB_APP_READ_PASSWORD="${DB_APP_READ_PASSWORD}" \
  --from-literal=DB_APP_READ_WRITE_USER="${DB_APP_READ_WRITE_USER}" \
  --from-literal=DB_APP_READ_WRITE_PASSWORD="${DB_APP_READ_WRITE_PASSWORD}" \
  --from-literal=DB_MANAGEMENT_NAME="${DB_MANAGEMENT_NAME}" \
  --from-literal=DB_MANAGEMENT_OWNER_USER="${DB_MANAGEMENT_OWNER_USER}" \
  --from-literal=DB_MANAGEMENT_OWNER_PASSWORD="${DB_MANAGEMENT_OWNER_PASSWORD}" \
  --from-literal=DB_MANAGEMENT_MIGRATOR_USER="${DB_MANAGEMENT_MIGRATOR_USER}" \
  --from-literal=DB_MANAGEMENT_MIGRATOR_PASSWORD="${DB_MANAGEMENT_MIGRATOR_PASSWORD}" \
  --from-literal=DB_MANAGEMENT_READ_USER="${DB_MANAGEMENT_READ_USER}" \
  --from-literal=DB_MANAGEMENT_READ_PASSWORD="${DB_MANAGEMENT_READ_PASSWORD}" \
  --from-literal=DB_MANAGEMENT_READ_WRITE_USER="${DB_MANAGEMENT_READ_WRITE_USER}" \
  --from-literal=DB_MANAGEMENT_READ_WRITE_PASSWORD="${DB_MANAGEMENT_READ_WRITE_PASSWORD}" \
  --dry-run=client -o yaml >"${TMP_FILE}"

sops --encrypt --encrypted-regex '^(data|stringData)$' \
  --input-type=yaml "${TMP_FILE}" >"${OUTPUT_FILE}"

echo "SUCCESS: ${OUTPUT_FILE}"
echo "Verify: sops -d ${OUTPUT_FILE}"
echo "Apply:  sops -d ${OUTPUT_FILE} | kubectl apply -f -"
