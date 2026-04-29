#!/usr/bin/env bash
# Re-run Metaboost K8s bootstrap scripts against a running local Postgres container.
# Use after password rotation (initdb.d only runs on empty PGDATA) or to sync role passwords/grants.
# Paths must match infra/docker/local/docker-compose.yml postgres volumes:
#   /docker-entrypoint-initdb.d/0001_create_app_db_users.sh
#   /docker-entrypoint-initdb.d/0002_setup_management_database.sh
#
# Usage: run-postgres-bootstrap-in-container.sh <container> <db.env> <1|2|all>

set -euo pipefail

CONTAINER="${1:?container name required}"
ENV_FILE="${2:?db.env path required}"
STEP="${3:-all}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Not found: $ENV_FILE" >&2
  exit 1
fi

if [[ "$STEP" != "1" && "$STEP" != "2" && "$STEP" != "all" ]]; then
  echo "Step must be 1, 2, or all (default)" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

INIT1="/docker-entrypoint-initdb.d/0001_create_app_db_users.sh"
INIT2="/docker-entrypoint-initdb.d/0002_setup_management_database.sh"

run_0001() {
  docker exec -i \
    -e "DB_APP_ADMIN_USER=${DB_APP_ADMIN_USER}" \
    -e "DB_APP_NAME=${DB_APP_NAME}" \
    -e "DB_APP_READ_USER=${DB_APP_READ_USER}" \
    -e "DB_APP_READ_PASSWORD=${DB_APP_READ_PASSWORD}" \
    -e "DB_APP_READ_WRITE_USER=${DB_APP_READ_WRITE_USER}" \
    -e "DB_APP_READ_WRITE_PASSWORD=${DB_APP_READ_WRITE_PASSWORD}" \
    "$CONTAINER" \
    bash "$INIT1"
}

run_0002() {
  docker exec -i \
    -e "DB_APP_ADMIN_USER=${DB_APP_ADMIN_USER}" \
    -e "DB_MANAGEMENT_NAME=${DB_MANAGEMENT_NAME:-metaboost_management}" \
    -e "DB_MANAGEMENT_ADMIN_USER=${DB_MANAGEMENT_ADMIN_USER}" \
    -e "DB_MANAGEMENT_ADMIN_PASSWORD=${DB_MANAGEMENT_ADMIN_PASSWORD}" \
    -e "DB_MANAGEMENT_READ_USER=${DB_MANAGEMENT_READ_USER}" \
    -e "DB_MANAGEMENT_READ_PASSWORD=${DB_MANAGEMENT_READ_PASSWORD}" \
    -e "DB_MANAGEMENT_READ_WRITE_USER=${DB_MANAGEMENT_READ_WRITE_USER}" \
    -e "DB_MANAGEMENT_READ_WRITE_PASSWORD=${DB_MANAGEMENT_READ_WRITE_PASSWORD}" \
    "$CONTAINER" \
    bash "$INIT2"
}

case "$STEP" in
1) run_0001 ;;
2) run_0002 ;;
all) run_0001 && run_0002 ;;
esac
