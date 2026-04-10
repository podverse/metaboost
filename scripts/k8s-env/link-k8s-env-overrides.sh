#!/usr/bin/env bash
# Symlink dev/env-overrides/<ENV>/*.env from ~/.config/boilerplate/<ENV>-env-overrides/ when the home file exists.
# Usage: link-k8s-env-overrides.sh --env alpha|beta|prod
#
# Override home root with BOILERPLATE_HOME_ENV_OVERRIDES_DIR

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=../env-overrides/home-override-env-files.inc.sh
source "$REPO_ROOT/scripts/env-overrides/home-override-env-files.inc.sh"

ENV_NAME=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_NAME="${2:-}"
      shift 2
      ;;
    -h | --help)
      echo "Usage: link-k8s-env-overrides.sh --env alpha|beta|prod"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ENV_NAME" ]]; then
  echo "Error: --env is required" >&2
  exit 1
fi

REPO_ENV_DIR="dev/env-overrides/${ENV_NAME}"

OVERRIDE_ENV_NAMES=("${BOILERPLATE_HOME_OVERRIDE_ENV_FILES[@]}")

if [[ -n "${BOILERPLATE_HOME_ENV_OVERRIDES_DIR:-}" ]]; then
  HOME_OVERRIDES_RAW="$BOILERPLATE_HOME_ENV_OVERRIDES_DIR"
else
  HOME_OVERRIDES_RAW="${HOME:-}/.config/boilerplate/${ENV_NAME}-env-overrides"
fi

HOME_OVERRIDES_EXPANDED="${HOME_OVERRIDES_RAW/#\~/$HOME}"
mkdir -p "$HOME_OVERRIDES_EXPANDED"
HOME_OVERRIDES_DIR="$(cd "$HOME_OVERRIDES_EXPANDED" && pwd)"

mkdir -p "$REPO_ENV_DIR"

linked=0
for target_name in "${OVERRIDE_ENV_NAMES[@]}"; do
  home_file="$HOME_OVERRIDES_DIR/$target_name"
  repo_file="$REPO_ENV_DIR/$target_name"

  if [[ ! -f "$home_file" ]]; then
    continue
  fi

  if [[ ! -e "$repo_file" ]]; then
    ln -s "$home_file" "$repo_file"
    echo "Linked $repo_file -> $home_file"
    linked=$((linked + 1))
  fi
done

if [[ "$linked" -eq 0 ]]; then
  echo "No matching files in $HOME_OVERRIDES_DIR. Nothing to link."
  echo "Run make k8s_env_prepare K8S_ENV=${ENV_NAME}, add override files, then make k8s_env_link K8S_ENV=${ENV_NAME}"
fi

echo ""
echo "${ENV_NAME} overrides directory: $HOME_OVERRIDES_DIR"
