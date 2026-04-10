#!/bin/bash
# Verify that committed k8s postgres-init combined SQL (0003_app_schema.sql, 0005_management_schema.sql.frag) matches migration directories.
#
# Used by CI and make check_k8s_postgres_init_sync. Canonical combined SQL lives under
# infra/k8s/base/stack/postgres-init/ (see scripts/database/combine-migrations.sh).
# Run after editing files in infra/database/migrations/ or infra/management-database/migrations/.
#
# Usage: ./scripts/database/verify-migrations-combined.sh
# Exit code: 0 if files match, 1 if mismatch

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "Verifying database migration files are combined..."
echo ""

# Build combined output to temp (same logic as combine-migrations.sh, without timestamp)
combine_to_temp() {
  local migrations_dir="$1"
  local output_file="$2"

  echo "-- Combined migrations (verification)" > "$output_file"
  echo "-- DO NOT EDIT - regenerate with scripts/database/combine-migrations.sh" >> "$output_file"
  echo "" >> "$output_file"

  for migration in $(ls "$migrations_dir"/*.sql 2>/dev/null | sort); do
    echo "-- Including: $(basename "$migration")" >> "$output_file"
    cat "$migration" >> "$output_file"
    echo "" >> "$output_file"
    echo "" >> "$output_file"
  done
}

# Compare from line 2 onwards (skip timestamp line in committed combined file)
compare_files() {
  local expected="$1"
  local actual="$2"
  local name="$3"

  if diff -q <(tail -n +2 "$expected") <(tail -n +2 "$actual") > /dev/null 2>&1; then
    echo -e "${GREEN}✓ $name is up to date${NC}"
    return 0
  else
    echo -e "${RED}✗ $name is out of sync!${NC}"
    echo ""
    echo "Differences found:"
    diff <(tail -n +2 "$expected") <(tail -n +2 "$actual") || true
    return 1
  fi
}

ERRORS=0

# Main database
MAIN_MIGRATIONS="$REPO_ROOT/infra/database/migrations"
MAIN_COMBINED="$REPO_ROOT/infra/k8s/base/stack/postgres-init/0003_app_schema.sql"
MAIN_TEMP="$TEMP_DIR/0003_app_schema.sql"

combine_to_temp "$MAIN_MIGRATIONS" "$MAIN_TEMP"
if ! compare_files "$MAIN_TEMP" "$MAIN_COMBINED" "Main database (0003_app_schema.sql)"; then
  ERRORS=$((ERRORS + 1))
fi

echo ""

# Management database
MGMT_MIGRATIONS="$REPO_ROOT/infra/management-database/migrations"
MGMT_COMBINED="$REPO_ROOT/infra/k8s/base/stack/postgres-init/0005_management_schema.sql.frag"
MGMT_TEMP="$TEMP_DIR/0005_management_schema.sql.frag"

combine_to_temp "$MGMT_MIGRATIONS" "$MGMT_TEMP"
if ! compare_files "$MGMT_TEMP" "$MGMT_COMBINED" "Management database (0005_management_schema.sql.frag)"; then
  ERRORS=$((ERRORS + 1))
fi

echo ""

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}  Database migration files are out of sync!${NC}"
  echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}To fix, run:${NC}"
  echo "  bash scripts/database/combine-migrations.sh"
  echo ""
  echo "Then commit the updated infra/k8s/base/stack/postgres-init/0003_app_schema.sql / 0005_management_schema.sql.frag (and run combine-migrations.sh to sync base/db/postgres-init/)."
  exit 1
fi

echo -e "${GREEN}All database migration files are properly combined.${NC}"
exit 0
