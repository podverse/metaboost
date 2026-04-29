#!/usr/bin/env bash
# Run forward-only linear migrations for app or management database.
#
# Usage:
#   ./scripts/database/run-linear-migrations.sh --database app
#   ./scripts/database/run-linear-migrations.sh --database management --dry-run

set -euo pipefail
shopt -s nullglob

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

DATABASE=""
DRY_RUN=false

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5532}"
DB_APP_ADMIN_USER="${DB_APP_ADMIN_USER:-}"
DB_APP_ADMIN_PASSWORD="${DB_APP_ADMIN_PASSWORD:-}"
DB_NAME="${DB_NAME:-}"
ENV_FILE="$REPO_ROOT/infra/config/local/db.env"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--database)
      DATABASE="$2"
      shift 2
      ;;
    -n|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 --database <app|management> [--dry-run]"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 --database <app|management> [--dry-run]"
      exit 1
      ;;
  esac
done

if [[ -z "$DATABASE" ]]; then
  echo "Missing required --database <app|management> argument."
  echo "Usage: $0 --database <app|management> [--dry-run]"
  exit 1
fi

if [[ "$DATABASE" != "app" && "$DATABASE" != "management" ]]; then
  echo "Database must be one of: app, management"
  exit 1
fi

if [[ -z "$DB_APP_ADMIN_USER" || -z "$DB_APP_ADMIN_PASSWORD" || -z "$DB_NAME" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$ENV_FILE"
  fi
fi

if [[ "$DATABASE" == "app" ]]; then
  MIGRATIONS_DIR="$REPO_ROOT/infra/k8s/base/ops/source/database/linear-migrations/app"
  DB_APP_ADMIN_USER="${DB_APP_ADMIN_USER:-}"
  DB_APP_ADMIN_PASSWORD="${DB_APP_ADMIN_PASSWORD:-}"
  DB_NAME="${DB_NAME:-${DB_APP_NAME:-metaboost_app}}"
  LOCK_KEY="952001"
else
  MIGRATIONS_DIR="$REPO_ROOT/infra/k8s/base/ops/source/database/linear-migrations/management"
  DB_APP_ADMIN_USER="${DB_APP_ADMIN_USER:-${DB_MANAGEMENT_ADMIN_USER:-${DB_APP_ADMIN_USER:-}}}"
  DB_APP_ADMIN_PASSWORD="${DB_APP_ADMIN_PASSWORD:-${DB_MANAGEMENT_ADMIN_PASSWORD:-${DB_APP_ADMIN_PASSWORD:-}}}"
  DB_NAME="${DB_NAME:-${DB_MANAGEMENT_NAME:-metaboost_management}}"
  LOCK_KEY="952002"
fi

if [[ -z "$DB_APP_ADMIN_USER" || -z "$DB_APP_ADMIN_PASSWORD" || -z "$DB_NAME" ]]; then
  echo "Missing DB credentials. Provide DB_APP_ADMIN_USER/DB_APP_ADMIN_PASSWORD/DB_NAME or local db.env values."
  exit 1
fi

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Migration directory not found: $MIGRATIONS_DIR"
  exit 1
fi

# Prefer host psql (TCP to DB_HOST:DB_PORT) when postgresql is on PATH (e.g. Nix flake).
# If psql is missing, run psql inside the local Docker Postgres container (127.0.0.1:5432), like
# scripts/database/generate-linear-baseline.sh / run-postgres-bootstrap-in-container.sh.
# METABOOST_LOCAL_PG_CONTAINER overrides the container name (default metaboost_local_postgres).
PSQL_DOCKER_CONTAINER=""
resolve_psql_transport() {
  if command -v psql >/dev/null 2>&1; then
    return 0
  fi
  local c="${METABOOST_LOCAL_PG_CONTAINER:-metaboost_local_postgres}"
  if ! command -v docker >/dev/null 2>&1; then
    echo "psql not found and docker not available. Add postgresql to your dev shell (see flake.nix), or use ./scripts/nix/with-env." >&2
    exit 127
  fi
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "$c"; then
    echo "psql not found and Docker container '$c' is not running. Install psql, run make local_infra_up, or set METABOOST_LOCAL_PG_CONTAINER." >&2
    exit 127
  fi
  PSQL_DOCKER_CONTAINER="$c"
}
resolve_psql_transport

compute_sha256() {
  local target_file="$1"
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$target_file" | awk '{print $1}'
    return
  fi

  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$target_file" | awk '{print $1}'
    return
  fi

  echo "No sha256 checksum command available (need sha256sum or shasum)." >&2
  exit 1
}

sql_exec() {
  local sql="$1"
  if [[ -n "$PSQL_DOCKER_CONTAINER" ]]; then
    docker exec -e PGPASSWORD="$DB_APP_ADMIN_PASSWORD" "$PSQL_DOCKER_CONTAINER" \
      psql -h 127.0.0.1 -p 5432 -U "$DB_APP_ADMIN_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -t -A -c "$sql"
  else
    PGPASSWORD="$DB_APP_ADMIN_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_APP_ADMIN_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -t -A -c "$sql"
  fi
}

sql_exec_file_and_record_in_tx() {
  local sql_file="$1"
  local migration_filename="$2"
  local migration_checksum="$3"
  local escaped_filename escaped_checksum

  escaped_filename="${migration_filename//\'/\'\'}"
  escaped_checksum="${migration_checksum//\'/\'\'}"

  {
    echo "BEGIN;"
    # Same connection/transaction as migration SQL; session lock + unlock across separate psql -c was invalid and caused ExclusiveLock warnings.
    echo "SELECT pg_advisory_xact_lock($LOCK_KEY);"
    cat "$sql_file"
    printf "INSERT INTO linear_migration_history (migration_filename, migration_checksum) VALUES ('%s', '%s');\n" "$escaped_filename" "$escaped_checksum"
    echo "COMMIT;"
  } | if [[ -n "$PSQL_DOCKER_CONTAINER" ]]; then
    docker exec -i -e PGPASSWORD="$DB_APP_ADMIN_PASSWORD" "$PSQL_DOCKER_CONTAINER" \
      psql -h 127.0.0.1 -p 5432 -U "$DB_APP_ADMIN_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
  else
    PGPASSWORD="$DB_APP_ADMIN_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_APP_ADMIN_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1
  fi
}

sql_exec "CREATE TABLE IF NOT EXISTS linear_migration_history (id SERIAL PRIMARY KEY, migration_filename VARCHAR(255) NOT NULL UNIQUE, migration_checksum VARCHAR(64) NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());" >/dev/null
sql_exec "CREATE INDEX IF NOT EXISTS idx_linear_migration_history_applied_at ON linear_migration_history(applied_at DESC);" >/dev/null

mapfile -t migration_files < <(printf '%s\n' "$MIGRATIONS_DIR"/*.sql | sort)
if ((${#migration_files[@]} == 0)); then
  echo "No migration files found in $MIGRATIONS_DIR"
  exit 0
fi

echo "Database: $DATABASE"
if [[ -n "$PSQL_DOCKER_CONTAINER" ]]; then
  echo "Connection: docker exec $PSQL_DOCKER_CONTAINER -> 127.0.0.1:5432 / $DB_NAME"
else
  echo "Connection: $DB_HOST:$DB_PORT / $DB_NAME"
fi
echo "Migrations directory: $MIGRATIONS_DIR"
echo ""

for migration_path in "${migration_files[@]}"; do
  migration_filename="$(basename "$migration_path")"
  migration_checksum="$(compute_sha256 "$migration_path")"
  escaped_filename="${migration_filename//\'/\'\'}"

  existing_checksum="$(sql_exec "SELECT migration_checksum FROM linear_migration_history WHERE migration_filename='$escaped_filename' LIMIT 1;")"
  if [[ -n "$existing_checksum" ]]; then
    if [[ "$existing_checksum" != "$migration_checksum" ]]; then
      echo "Checksum mismatch for already-applied migration: $migration_filename"
      echo "Expected: $existing_checksum"
      echo "Actual:   $migration_checksum"
      exit 1
    fi
    echo "SKIP $migration_filename (already applied)"
    continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "PENDING $migration_filename"
    continue
  fi

  echo "APPLY $migration_filename"
  {
    sql_exec_file_and_record_in_tx "$migration_path" "$migration_filename" "$migration_checksum"
  } || {
    echo "Failed applying migration: $migration_filename"
    exit 1
  }
done

if [[ "$DRY_RUN" == true ]]; then
  echo ""
  echo "Dry-run completed."
else
  echo ""
  echo "Linear migration run completed."
fi
