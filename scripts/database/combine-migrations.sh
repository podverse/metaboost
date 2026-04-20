#!/bin/bash
# Canonical postgres init source is infra/k8s/base/db/postgres-init.
# This script keeps stack shell-script wrappers aligned to canonical db scripts and removes legacy
# stack SQL duplicates.
#
# Usage: ./scripts/database/combine-migrations.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

K8S_POSTGRES_INIT_STACK="$REPO_ROOT/infra/k8s/base/stack/postgres-init"
K8S_POSTGRES_INIT_DB="$REPO_ROOT/infra/k8s/base/db/postgres-init"
mkdir -p "$K8S_POSTGRES_INIT_STACK" "$K8S_POSTGRES_INIT_DB"

# Canonical required SQL files
for f in 0003_app_schema.sql 0005_management_schema.sql.frag; do
  if [ ! -f "$K8S_POSTGRES_INIT_DB/$f" ]; then
    echo "Missing canonical SQL file: $K8S_POSTGRES_INIT_DB/$f"
    exit 1
  fi
done

# Keep stack shell scripts aligned (no SQL duplication in stack).
for f in 0001_create_app_db_users.sh 0002_setup_management_database.sh 0004_load_management_schema.sh 0006_management_grants.sh; do
  cp "$K8S_POSTGRES_INIT_DB/$f" "$K8S_POSTGRES_INIT_STACK/$f"
done
chmod +x "$K8S_POSTGRES_INIT_STACK"/*.sh "$K8S_POSTGRES_INIT_DB"/*.sh
rm -f "$K8S_POSTGRES_INIT_STACK/0003_app_schema.sql" "$K8S_POSTGRES_INIT_STACK/0005_management_schema.sql.frag"

echo "✓ Canonical SQL confirmed in $K8S_POSTGRES_INIT_DB"
echo "✓ Stack shell scripts synced from canonical db path"
