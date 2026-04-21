#!/usr/bin/env bash
# Fail if docs/development/ENV-VARS-CATALOG.md is stale vs classification YAML.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"

RUBY="${METABOOST_ENV_RUBY:-ruby}"
DOC="$REPO_ROOT/docs/development/ENV-VARS-CATALOG.md"

if [[ ! -f "$DOC" ]]; then
  echo "Error: missing $DOC (run: make env_catalog)" >&2
  exit 1
fi

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

"$RUBY" "$REPO_ROOT/scripts/env-classification/env-vars-catalog.rb" --output "$TMP"

if ! diff -q "$DOC" "$TMP" >/dev/null; then
  echo "Error: ENV-VARS-CATALOG.md is out of sync with infra/env/classification." >&2
  echo "Regenerate with: make env_catalog" >&2
  diff -u "$DOC" "$TMP" >&2 || true
  exit 1
fi

echo "validate-env-vars-catalog: OK"
