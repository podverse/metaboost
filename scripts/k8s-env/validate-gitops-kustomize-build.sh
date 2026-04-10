#!/usr/bin/env bash
# Run kubectl kustomize on each metaboost-<env> component overlay in a GitOps repo.
# Catches invalid dotenv lines or kustomization errors after alpha_env_render.
# Usage: validate-gitops-kustomize-build.sh --output-repo PATH [--env alpha|beta|prod]
set -euo pipefail

OUTPUT_REPO=""
ENV_NAME="${K8S_ENV:-alpha}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-repo)
      OUTPUT_REPO="${2:-}"
      shift 2
      ;;
    --env)
      ENV_NAME="${2:-}"
      shift 2
      ;;
    -h | --help)
      sed -n '1,8p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$OUTPUT_REPO" && -n "${METABOOST_K8S_OUTPUT_REPO:-}" ]]; then
  OUTPUT_REPO="$METABOOST_K8S_OUTPUT_REPO"
fi
if [[ -z "$OUTPUT_REPO" ]]; then
  echo "validate-gitops-kustomize-build: pass --output-repo PATH or set METABOOST_K8S_OUTPUT_REPO" >&2
  exit 1
fi

ROOT="$(cd "$OUTPUT_REPO" && pwd)"
OVERLAY="${ROOT}/apps/metaboost-${ENV_NAME}"

if [[ ! -d "$OVERLAY" ]]; then
  echo "validate-gitops-kustomize-build: missing ${OVERLAY}" >&2
  exit 1
fi

if ! command -v kubectl >/dev/null 2>&1; then
  echo "validate-gitops-kustomize-build: kubectl is required" >&2
  exit 1
fi

# Same component dirs as render (stack/common omitted — not standalone kustomize roots).
COMPONENTS=(api db keyvaldb web management-api management-web)
failed=0
for c in "${COMPONENTS[@]}"; do
  d="${OVERLAY}/${c}"
  if [[ ! -f "${d}/kustomization.yaml" ]]; then
    continue
  fi
  if ! kubectl kustomize --load-restrictor LoadRestrictionsNone "$d" >/dev/null; then
    echo "validate-gitops-kustomize-build: FAILED kustomize build ${d}" >&2
    failed=1
  else
    echo "validate-gitops-kustomize-build: OK ${d}"
  fi
done

if [[ "$failed" -ne 0 ]]; then
  exit 1
fi

echo "validate-gitops-kustomize-build: all overlays OK (${ENV_NAME})"
