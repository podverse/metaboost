#!/usr/bin/env bash
# Renders every infra/k8s/base/* bundle (no cluster apply). Fails if any kustomize build fails.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

FAIL=0
for d in api web management-api management-web db keyvaldb ops; do
  if kubectl kustomize "infra/k8s/base/$d" --load-restrictor LoadRestrictionsNone >/dev/null; then
    echo "ok infra/k8s/base/$d"
  else
    echo "FAIL infra/k8s/base/$d" >&2
    FAIL=1
  fi
done
exit "$FAIL"
