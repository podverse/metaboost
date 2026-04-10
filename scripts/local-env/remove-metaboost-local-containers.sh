#!/usr/bin/env bash
# Remove Docker containers whose names contain metaboost_local (main stack uses metaboost_local_*).
# Catches orphans not torn down by infra/docker/local/docker-compose.yml (e.g. alternate compose files, dev-watch).
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  exit 0
fi

docker ps -aq --filter name=metaboost_local | xargs -n1 docker rm -f 2>/dev/null || true
