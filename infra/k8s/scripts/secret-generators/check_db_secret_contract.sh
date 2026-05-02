#!/usr/bin/env bash
# Validates Metaboost DB secret key contract in encrypted SOPS files.
set -euo pipefail

ENVIRONMENT="${1:-alpha}"
FILE="./secrets/metaboost-${ENVIRONMENT}-db-secrets.enc.yaml"

if [[ ! -f "$FILE" ]]; then
  echo "ERROR: Missing file: $FILE" >&2
  exit 1
fi

assert_key() {
  local file="$1"
  local key="$2"
  if ! rg -q "^[[:space:]]+${key}:" "$file"; then
    echo "ERROR: Missing required key '${key}' in ${file}" >&2
    exit 1
  fi
}

# App DB required keys
assert_key "$FILE" "DB_APP_NAME"
assert_key "$FILE" "DB_APP_OWNER_USER"
assert_key "$FILE" "DB_APP_OWNER_PASSWORD"
assert_key "$FILE" "DB_APP_MIGRATOR_USER"
assert_key "$FILE" "DB_APP_MIGRATOR_PASSWORD"
assert_key "$FILE" "DB_APP_READ_WRITE_USER"
assert_key "$FILE" "DB_APP_READ_WRITE_PASSWORD"
assert_key "$FILE" "DB_APP_READ_USER"
assert_key "$FILE" "DB_APP_READ_PASSWORD"

# Management DB required keys
assert_key "$FILE" "DB_MANAGEMENT_NAME"
assert_key "$FILE" "DB_MANAGEMENT_OWNER_USER"
assert_key "$FILE" "DB_MANAGEMENT_OWNER_PASSWORD"
assert_key "$FILE" "DB_MANAGEMENT_MIGRATOR_USER"
assert_key "$FILE" "DB_MANAGEMENT_MIGRATOR_PASSWORD"
assert_key "$FILE" "DB_MANAGEMENT_READ_WRITE_USER"
assert_key "$FILE" "DB_MANAGEMENT_READ_WRITE_PASSWORD"
assert_key "$FILE" "DB_MANAGEMENT_READ_USER"
assert_key "$FILE" "DB_MANAGEMENT_READ_PASSWORD"

echo "DB secret contract check passed for environment '${ENVIRONMENT}'."
