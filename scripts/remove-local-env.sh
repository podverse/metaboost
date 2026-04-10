#!/usr/bin/env bash
# Removes local .env files (infra/config/local/*.env, apps/api/.env, apps/web/.env.local, apps/management-api/.env, apps/management-web/.env.local).
# Prompts for confirmation (type Y) before deleting. Run from repo root.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FILES=(
  infra/config/local/api.env
  infra/config/local/web.env
  infra/config/local/db-source-only.env
  infra/config/local/db.env
  infra/config/local/valkey-source-only.env
  infra/config/local/valkey.env
  apps/api/.env
  apps/web/.env.local
  apps/management-api/.env
  apps/management-web/.env.local
)

EXISTING=()
for f in "${FILES[@]}"; do
  if [[ -f "$f" ]]; then
    EXISTING+=("$f")
  fi
done

if [[ ${#EXISTING[@]} -eq 0 ]]; then
  echo "No local .env files found. Nothing to remove."
  exit 0
fi

echo "The following local .env files will be deleted:"
printf '  %s\n' "${EXISTING[@]}"
echo ""
printf 'Type Y to confirm deletion: '
read -r reply
if [[ "$reply" != "Y" && "$reply" != "y" ]]; then
  echo "Aborted."
  exit 1
fi

rm -f "${EXISTING[@]}"
echo "Removed ${#EXISTING[@]} file(s)."
echo "Run 'make local_env_setup' (or 'make env_setup') to recreate env files. If using home overrides, run 'make local_env_link' first. Then 'make local_infra_up' or 'make local_all_up' so Postgres and Valkey start fresh with those passwords."
