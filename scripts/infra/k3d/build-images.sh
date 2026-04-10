#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

docker build -f infra/docker/local/api/Dockerfile -t metaboost-local-api:latest .
docker build -f infra/docker/local/management-api/Dockerfile -t metaboost-local-management-api:latest .
docker build -f infra/docker/local/web-sidecar/Dockerfile -t metaboost-local-web-sidecar:latest .
docker build -f infra/docker/local/web/Dockerfile -t metaboost-local-web:latest .
docker build -f infra/docker/local/management-web-sidecar/Dockerfile -t metaboost-local-management-web-sidecar:latest .
docker build -f infra/docker/local/management-web/Dockerfile -t metaboost-local-management-web:latest .

echo "Built local k3d images."
