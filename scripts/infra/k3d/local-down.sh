#!/usr/bin/env bash

set -euo pipefail

CLUSTER_NAME="${K3D_CLUSTER_NAME:-metaboost-local}"

if k3d cluster list "$CLUSTER_NAME" >/dev/null 2>&1; then
  k3d cluster delete "$CLUSTER_NAME"
fi

echo "Deleted k3d cluster: $CLUSTER_NAME"
