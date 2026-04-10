#!/usr/bin/env bash
# Smoke test: merged env + port contract produce YAML (no GitOps write).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
ruby scripts/k8s-env/render_remote_k8s_ports.rb --env alpha --dry-run >/dev/null
echo "test-render-remote-k8s-ports: OK"
