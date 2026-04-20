#!/bin/bash
# Verify canonical postgres-init SQL/scripts under infra/k8s/base/db/postgres-init and ensure there
# are no legacy SQL sources under infra/database or infra/management-database.
#
# Used by CI and make check_k8s_postgres_init_sync.
#
# Usage: ./scripts/database/verify-migrations-combined.sh
# Exit code: 0 if verification passes, 1 otherwise

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Verifying canonical postgres-init source..."
echo ""

ERRORS=0

DB_INIT="$REPO_ROOT/infra/k8s/base/db/postgres-init"
STACK_INIT="$REPO_ROOT/infra/k8s/base/stack/postgres-init"

for f in 0001_create_app_db_users.sh 0002_setup_management_database.sh 0003_app_schema.sql 0004_load_management_schema.sh 0005_management_schema.sql.frag 0006_management_grants.sh; do
  if [ -f "$DB_INIT/$f" ]; then
    echo -e "${GREEN}✓ Found canonical $f${NC}"
  else
    echo -e "${RED}✗ Missing canonical file: $DB_INIT/$f${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done

if [ -f "$STACK_INIT/0003_app_schema.sql" ] || [ -f "$STACK_INIT/0005_management_schema.sql.frag" ]; then
  echo -e "${RED}✗ Stack SQL duplicates detected in $STACK_INIT (0003/0005 should only exist in base/db).${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ No stack SQL duplicates detected${NC}"
fi

for f in 0001_create_app_db_users.sh 0002_setup_management_database.sh 0004_load_management_schema.sh 0006_management_grants.sh; do
  if diff -q "$DB_INIT/$f" "$STACK_INIT/$f" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Stack shell script matches canonical: $f${NC}"
  else
    echo -e "${RED}✗ Stack shell script differs from canonical: $f${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done

if find "$REPO_ROOT/infra/database" -name '*.sql' -print -quit | grep -q .; then
  echo -e "${RED}✗ Legacy SQL files still present under infra/database.${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ No legacy SQL files under infra/database${NC}"
fi

if find "$REPO_ROOT/infra/management-database" -name '*.sql' -print -quit | grep -q .; then
  echo -e "${RED}✗ Legacy SQL files still present under infra/management-database.${NC}"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓ No legacy SQL files under infra/management-database${NC}"
fi

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
  echo -e "${RED}  Canonical postgres-init verification failed!${NC}"
  echo -e "${RED}════════════════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "${YELLOW}To fix, run:${NC}"
  echo "  bash scripts/database/combine-migrations.sh"
  echo ""
  echo "Then ensure canonical files exist under infra/k8s/base/db/postgres-init and legacy SQL directories remain SQL-free."
  exit 1
fi

echo -e "${GREEN}Canonical postgres-init verification passed.${NC}"
exit 0
