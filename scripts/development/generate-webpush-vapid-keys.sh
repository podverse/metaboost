#!/usr/bin/env bash
# Print a new VAPID key pair for Web Push. Copy the public and private values into
# WEBPUSH_VAPID_PUBLIC_KEY / WEBPUSH_VAPID_PRIVATE_KEY (and the same public key into
# NEXT_PUBLIC_WEBPUSH_VAPID_PUBLIC_KEY on the web sidecar / runtime config).
# See docs/development/env/WEB-PUSH-LOCAL.md

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

exec ./scripts/nix/with-env npm run webpush:generate-vapid-keys -w @metaboost/api
