#!/usr/bin/env bash
# Ensure ~/.config/metaboost/local-env-overrides exists for optional local env overrides.
# Defaults and key lists are seeded from canonical .env.example templates.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      echo "Usage: prepare-home-env-overrides.sh"
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -n "${METABOOST_HOME_OVERRIDES_DIR:-}" ]]; then
  HOME_OVERRIDES_RAW="$METABOOST_HOME_OVERRIDES_DIR"
else
  HOME_OVERRIDES_RAW="${HOME:-}/.config/metaboost/local-env-overrides"
fi

HOME_OVERRIDES_EXPANDED="${HOME_OVERRIDES_RAW/#\~/$HOME}"
mkdir -p "$HOME_OVERRIDES_EXPANDED"
HOME_OVERRIDES_DIR="$(cd "$HOME_OVERRIDES_EXPANDED" && pwd)"

if ! command -v ruby >/dev/null 2>&1; then
  echo "Error: ruby is required to generate home override stubs from canonical templates." >&2
  exit 1
fi

METABOOST_ENV_RUBY="${METABOOST_ENV_RUBY:-ruby}"
"$METABOOST_ENV_RUBY" "$REPO_ROOT/scripts/env-overrides/write-home-override-stubs.rb" \
  --output-dir "$HOME_OVERRIDES_DIR"

echo "Override directory ready: $HOME_OVERRIDES_DIR"
echo "New files get every override key with defaults from canonical .env.example templates."
echo "Existing files are not overwritten wholesale; missing keys are appended with template defaults. Use write-home-override-stubs.rb --force to replace a file entirely (see script help)."

cat <<EOF

Then run:

  make local_env_link
  make local_env_setup

Link creates symlinks in dev/env-overrides/local/ for files that exist here; setup merges overrides into generated env.
EOF
