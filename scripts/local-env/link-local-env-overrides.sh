#!/usr/bin/env bash
# Symlink dev/env-overrides/local/*.env -> ~/.config/boilerplate/local-env-overrides/ when the home file exists.
# Override basenames match infra/env/classification anchor override_file names (see ENV-REFERENCE.md).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=../env-overrides/home-override-env-files.inc.sh
source "$REPO_ROOT/scripts/env-overrides/home-override-env-files.inc.sh"

REPO_ENV_DIR="dev/env-overrides/local"

OVERRIDE_ENV_NAMES=("${BOILERPLATE_HOME_OVERRIDE_ENV_FILES[@]}")

# Default: XDG-style path; override with BOILERPLATE_HOME_OVERRIDES_DIR
if [ -n "${BOILERPLATE_HOME_OVERRIDES_DIR:-}" ]; then
  HOME_OVERRIDES_RAW="$BOILERPLATE_HOME_OVERRIDES_DIR"
else
  HOME_OVERRIDES_RAW="${HOME:-}/.config/boilerplate/local-env-overrides"
fi

HOME_OVERRIDES_EXPANDED="${HOME_OVERRIDES_RAW/#\~/$HOME}"
mkdir -p "$HOME_OVERRIDES_EXPANDED"
HOME_OVERRIDES_DIR="$(cd "$HOME_OVERRIDES_EXPANDED" && pwd)"

mkdir -p "$REPO_ENV_DIR"
mkdir -p "$HOME_OVERRIDES_DIR"

linked=0
for target_name in "${OVERRIDE_ENV_NAMES[@]}"; do
  home_file="$HOME_OVERRIDES_DIR/$target_name"
  repo_file="$REPO_ENV_DIR/$target_name"

  if [ ! -f "$home_file" ]; then
    continue
  fi

  if [ ! -e "$repo_file" ]; then
    ln -s "$home_file" "$repo_file"
    echo "Linked $repo_file -> $home_file"
    linked=$((linked + 1))
  fi
done

if [ "$linked" -eq 0 ]; then
  echo "No matching files in $HOME_OVERRIDES_DIR (expected names: ${OVERRIDE_ENV_NAMES[*]}). Nothing to link."
  echo "Run make local_env_prepare (creates stub override files if missing), then re-run make local_env_link."
fi

echo ""
echo "Local overrides directory: $HOME_OVERRIDES_DIR"
echo "When linked, edits apply to this and other work trees using the same home path."
echo "Then run: make local_env_setup"
