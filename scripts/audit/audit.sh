#!/bin/bash
# Check for vulnerabilities in all packages
# Usage: ./scripts/audit/audit.sh [--fix]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo "=== Boilerplate Dependency Audit ==="
echo ""

# Check for --fix flag
if [ "$1" = "--fix" ]; then
  echo "Running npm audit fix..."
  npm audit fix --omit=dev --workspaces || true
  echo ""
fi

# Run npm audit --omit=dev (capture exit for when jq is not available)
echo "Running npm audit --omit=dev..."
AUDIT_EXIT=0
npm audit --omit=dev || AUDIT_EXIT=$?

echo ""
echo "=== Audit Complete ==="

# Summary with vulnerability count or npm exit code
if command -v jq &> /dev/null; then
  VULNS=$(npm audit --omit=dev --json 2> /dev/null | jq -r '.metadata.vulnerabilities.total // 0' || echo "0")
  if [ -n "$VULNS" ] && [ "$VULNS" -eq "$VULNS" ] 2> /dev/null && [ "$VULNS" -gt 0 ]; then
    echo ""
    echo "Found $VULNS vulnerabilities"
    echo "Run './scripts/audit/audit.sh --fix' to attempt automatic fixes"
    exit 1
  else
    echo "No vulnerabilities found"
  fi
  if [ "$AUDIT_EXIT" != "0" ]; then
    exit 1
  fi
else
  if [ "$AUDIT_EXIT" != "0" ]; then
    echo ""
    echo "Note: Install 'jq' for vulnerability count summary"
    exit 1
  else
    echo "Note: Install 'jq' for vulnerability count summary"
  fi
fi
