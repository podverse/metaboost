#!/usr/bin/env bash
# Create empty infra/config/local/*.env files when missing so docker compose can parse
# stop/down/remove commands. Real values come from make local_env_setup — do not use empty
# stubs to start the stack.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DIR="$REPO_ROOT/infra/config/local"

mkdir -p "$DIR"

# Paths referenced by infra/docker/local/docker-compose.yml (env_file)
for f in \
  db.env \
  valkey-source-only.env \
  valkey.env \
  api.env \
  web.env \
  web-sidecar.env \
  management-api.env \
  management-web.env \
  management-web-sidecar.env; do
  if [[ ! -f "$DIR/$f" ]]; then
    touch "$DIR/$f"
  fi
done
