#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

mkdir -p .secrets

if [ -f .secrets/age.key ]; then
  echo ".secrets/age.key already exists. Remove it first if you want a new key."
  exit 1
fi

age-keygen -o .secrets/age.key
chmod 600 .secrets/age.key

echo "Generated age key at .secrets/age.key"
echo "Public key:"
grep "^# public key:" .secrets/age.key | sed "s/^# public key: //"
