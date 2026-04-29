#!/usr/bin/env bash
# Rebuild a single initdb SQL file from: bootstrap scripts, then the full
# linear app + management migration chains, then pg_dump of each database.
# Default output: infra/k8s/base/db/source/bootstrap/0003_linear_baseline.sql.gz (gzip -n for minimal headers).
# Pass a path ending in .sql for uncompressed output (debugging).
# Do not edit 0003 manually; re-run this script after migration changes.
#
# Requires: docker, gzip (when writing .gz)
#
# Usage: ./scripts/database/generate-linear-baseline.sh [output.sql.gz | output.sql]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck disable=SC1091
set -a
# shellcheck source=scripts/database/db.generate-baseline.env
source "$SCRIPT_DIR/db.generate-baseline.env"
set +a

export REPO_ROOT
export DB_HOST="${DB_HOST:-127.0.0.1}"
export DB_PORT="${DB_PORT:-5432}"

OUT_REL_DEFAULT="infra/k8s/base/db/source/bootstrap/0003_linear_baseline.sql.gz"
OUT="${1:-$REPO_ROOT/$OUT_REL_DEFAULT}"
if [[ "$OUT" != /* ]]; then
  OUT="$REPO_ROOT/$OUT"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to generate the linear baseline." >&2
  exit 1
fi

CONTAINER_NAME="metaboost-linear-baseline-$$"
APP_DUMP="$(mktemp)"
MGT_DUMP="$(mktemp)"
TMP_COMBINED="$(mktemp)"
cleanup() {
  rm -f "$APP_DUMP" "$MGT_DUMP" "$TMP_COMBINED" 2>/dev/null || true
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d --name "$CONTAINER_NAME" \
  -v "$REPO_ROOT:/work" \
  -e "POSTGRES_USER=$DB_APP_ADMIN_USER" \
  -e "POSTGRES_PASSWORD=$DB_APP_ADMIN_PASSWORD" \
  -e "POSTGRES_DB=$DB_APP_NAME" \
  postgres:18.3 >/dev/null

for _ in $(seq 1 60); do
  if docker exec "$CONTAINER_NAME" pg_isready -U "$DB_APP_ADMIN_USER" -d "$DB_APP_NAME" -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

docker exec -i "$CONTAINER_NAME" bash -s <<'INNER'
set -euo pipefail
set -a
# shellcheck disable=SC1090
source /work/scripts/database/db.generate-baseline.env
set +a
export REPO_ROOT=/work
cd /work

APP_MIGRATIONS_DIR="/work/infra/k8s/base/ops/source/database/linear-migrations/app"
MGMT_MIGRATIONS_DIR="/work/infra/k8s/base/ops/source/database/linear-migrations/management"

bash /work/infra/k8s/base/db/source/bootstrap/0001_create_app_db_users.sh
bash /work/infra/k8s/base/db/source/bootstrap/0002_setup_management_database.sh

psql -v ON_ERROR_STOP=1 --username "$DB_APP_ADMIN_USER" -d "$DB_APP_NAME" <<SQL
CREATE TABLE IF NOT EXISTS linear_migration_history (
  id SERIAL PRIMARY KEY,
  migration_filename VARCHAR(255) NOT NULL UNIQUE,
  migration_checksum VARCHAR(64) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_linear_migration_history_applied_at
ON linear_migration_history(applied_at DESC);
SQL

for f in $(printf '%s\n' "$APP_MIGRATIONS_DIR"/*.sql | sort); do
  psql -v ON_ERROR_STOP=1 --username "$DB_APP_ADMIN_USER" -d "$DB_APP_NAME" -f "$f"
done

psql -v ON_ERROR_STOP=1 --username "$DB_APP_ADMIN_USER" -d "$DB_MANAGEMENT_NAME" <<SQL
CREATE TABLE IF NOT EXISTS linear_migration_history (
  id SERIAL PRIMARY KEY,
  migration_filename VARCHAR(255) NOT NULL UNIQUE,
  migration_checksum VARCHAR(64) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_linear_migration_history_applied_at
ON linear_migration_history(applied_at DESC);
SQL

for f in $(printf '%s\n' "$MGMT_MIGRATIONS_DIR"/*.sql | sort); do
  psql -v ON_ERROR_STOP=1 --username "$DB_APP_ADMIN_USER" -d "$DB_MANAGEMENT_NAME" -f "$f"
done
INNER

docker exec -e "PGPASSWORD=$DB_APP_ADMIN_PASSWORD" "$CONTAINER_NAME" \
  pg_dump -h 127.0.0.1 -p 5432 -U "$DB_APP_ADMIN_USER" -d "$DB_APP_NAME" --schema-only --no-owner > "$APP_DUMP"

docker exec -e "PGPASSWORD=$DB_APP_ADMIN_PASSWORD" "$CONTAINER_NAME" \
  pg_dump -h 127.0.0.1 -p 5432 -U "$DB_APP_ADMIN_USER" -d "$DB_MANAGEMENT_NAME" --schema-only --no-owner > "$MGT_DUMP"

for f in "$APP_DUMP" "$MGT_DUMP"; do
  if grep -qE '^\\(un)?restrict ' "$f" 2>/dev/null; then
    sed -E '/^\\(un)?restrict /d' "$f" > "${f}.sedtmp" && mv "${f}.sedtmp" "$f"
  fi
done

{
  printf '%s\n' "-- GENERATED FILE (do not edit) — see scripts/database/generate-linear-baseline.sh" ""
  printf '%s\n' "\\connect $DB_APP_NAME" ""
  cat "$APP_DUMP"
  printf '\n'
  printf '%s\n' "\\connect $DB_MANAGEMENT_NAME" ""
  cat "$MGT_DUMP"
  printf '\n'
} > "$TMP_COMBINED"

if [[ "$OUT" == *.sql ]]; then
  mv "$TMP_COMBINED" "$OUT"
else
  if ! command -v gzip >/dev/null 2>&1; then
    echo "gzip is required to write compressed baseline (.sql.gz)." >&2
    exit 1
  fi
  gzip -nc < "$TMP_COMBINED" > "$OUT"
fi

echo "Wrote: $OUT"
