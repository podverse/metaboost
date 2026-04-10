#!/usr/bin/env bash
# Usage: prepare-k8s-env-overrides.sh --env alpha|beta|prod
#
# Delegates to scripts/env-overrides/prepare-home-env-overrides.sh --profile k8s

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

ENV_NAME=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_NAME="${2:-}"
      shift 2
      ;;
    -h | --help)
      echo "Usage: prepare-k8s-env-overrides.sh --env alpha|beta|prod"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ENV_NAME" ]]; then
  echo "Error: --env is required (alpha|beta|prod)" >&2
  exit 1
fi

exec bash "$SCRIPT_DIR/../env-overrides/prepare-home-env-overrides.sh" --profile k8s --env "$ENV_NAME"
