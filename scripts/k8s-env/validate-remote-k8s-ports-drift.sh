#!/usr/bin/env bash
# Compare generated port + ingress patches to committed files (no full env render).
# Usage: validate-remote-k8s-ports-drift.sh [--env alpha|beta|prod] [--output-repo PATH]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=k8s-env-render-manifest.inc.sh
source "$SCRIPT_DIR/k8s-env-render-manifest.inc.sh"

ENV_NAME="${K8S_ENV:-alpha}"
OUTPUT_REPO_CLI=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_NAME="${2:-}"
      shift 2
      ;;
    --output-repo)
      OUTPUT_REPO_CLI="${2:-}"
      shift 2
      ;;
    -h | --help)
      sed -n '1,6p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ENV_NAME" ]]; then
  echo "Error: --env cannot be empty" >&2
  exit 1
fi

if [[ -n "$OUTPUT_REPO_CLI" ]]; then
  OUTPUT_REPO="$(cd "$OUTPUT_REPO_CLI" && pwd)"
elif [[ -n "${BOILERPLATE_K8S_OUTPUT_REPO:-}" ]]; then
  OUTPUT_REPO="$(cd "$BOILERPLATE_K8S_OUTPUT_REPO" && pwd)"
else
  echo "validate-remote-k8s-ports-drift: set BOILERPLATE_K8S_OUTPUT_REPO or pass --output-repo" >&2
  exit 1
fi

OVERLAY="apps/boilerplate-${ENV_NAME}"
COMPARE_ROOT="${OUTPUT_REPO}/${OVERLAY}"

if [[ ! -d "$COMPARE_ROOT" ]]; then
  echo "validate-remote-k8s-ports-drift: missing ${COMPARE_ROOT}" >&2
  exit 1
fi

TMP="$(mktemp -d)"
LOG="$(mktemp)"
trap 'rm -rf "$TMP"; rm -f "$LOG"' EXIT

export BOILERPLATE_ENV_PROFILE="${BOILERPLATE_ENV_PROFILE:-remote_k8s}"
if ! ruby "$SCRIPT_DIR/render_remote_k8s_ports.rb" --env "$ENV_NAME" --output-repo "$TMP" >"$LOG" 2>&1; then
  cat "$LOG" >&2
  exit 1
fi
rm -f "$LOG"

failed=0
mapfile -t rels < <(k8s_env_render_port_patch_relpaths_under_overlay)
rels+=("$(k8s_env_render_port_ingress_relpath_under_overlay)")

for rel in "${rels[@]}"; do
  left="${TMP}/${OVERLAY}/${rel}"
  right="${COMPARE_ROOT}/${rel}"
  if [[ ! -f "$right" ]]; then
    echo "validate-remote-k8s-ports-drift: missing committed ${right}" >&2
    failed=1
    continue
  fi
  if [[ ! -f "$left" ]]; then
    echo "validate-remote-k8s-ports-drift: render did not produce ${left}" >&2
    failed=1
    continue
  fi
  if ! cmp -s "$left" "$right"; then
    echo "validate-remote-k8s-ports-drift: mismatch ${OVERLAY}/${rel}" >&2
    diff -u "$right" "$left" >&2 || true
    failed=1
  fi
done

if [[ "$failed" -ne 0 ]]; then
  echo "validate-remote-k8s-ports-drift: FAILED — run \`make k8s_remote_ports_render\` (or \`make alpha_env_render\`) and commit." >&2
  exit 1
fi

echo "validate-remote-k8s-ports-drift: OK (${ENV_NAME} vs ${OUTPUT_REPO})"
