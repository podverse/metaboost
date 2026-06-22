#!/usr/bin/env bash
# Renders every infra/k8s/alpha/<component> overlay (no cluster apply).
# Committed kustomizations pin remote bases with publish placeholder X.Y.Z-staging.N;
# this script substitutes KUSTOMIZE_REF (commit SHA or staging tag) before kustomize build.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PUBLISH_REF_PLACEHOLDER='X.Y.Z-staging.N'
KUSTOMIZE_REF="${KUSTOMIZE_REF:-${1:-${GITHUB_SHA:-}}}"
if [ -z "$KUSTOMIZE_REF" ]; then
  KUSTOMIZE_REF="$(git rev-parse HEAD)"
fi

run_kustomize_build() {
  local dir="$1"
  if command -v kustomize >/dev/null 2>&1; then
    kustomize build --load-restrictor LoadRestrictionsNone "$dir"
  else
    kubectl kustomize "$dir" --load-restrictor LoadRestrictionsNone
  fi
}

FAIL=0
for overlay in infra/k8s/alpha/*/; do
  if [ ! -f "${overlay}kustomization.yaml" ]; then
    continue
  fi
  overlay_name="${overlay%/}"
  tmp="$(mktemp -d)"
  cp -R "${overlay}"* "$tmp/"
  sed "s/${PUBLISH_REF_PLACEHOLDER}/${KUSTOMIZE_REF}/g" "$tmp/kustomization.yaml" >"$tmp/kustomization.yaml.sub"
  mv "$tmp/kustomization.yaml.sub" "$tmp/kustomization.yaml"
  echo "=== kustomize build $overlay_name (ref=$KUSTOMIZE_REF) ==="
  if run_kustomize_build "$tmp" >/dev/null; then
    echo "ok $overlay_name"
  else
    echo "FAIL $overlay_name" >&2
    FAIL=1
  fi
  rm -rf "$tmp"
done
exit "$FAIL"
