#!/bin/bash
# Sync main branch to match develop (fast-forward merge only).
# Keeps main as a strict mirror of develop for Publish Main trigger flow.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

# Require a clean working tree to avoid accidental carry-over.
if ! git diff-index --quiet HEAD --; then
  echo -e "${RED}Error: You have uncommitted changes. Commit or stash before syncing.${NC}"
  exit 1
fi

if [ -n "$(git ls-files --others --exclude-standard)" ]; then
  echo -e "${YELLOW}Warning: Untracked files detected. They are ignored by this script.${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo -e "${YELLOW}Fetching latest origin refs...${NC}"
git fetch origin

if ! git show-ref --verify --quiet refs/heads/develop; then
  echo -e "${RED}Error: Local branch 'develop' does not exist.${NC}"
  echo -e "${YELLOW}Run: git checkout -b develop origin/develop${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/heads/main; then
  echo -e "${RED}Error: Local branch 'main' does not exist.${NC}"
  echo -e "${YELLOW}Run: git checkout -b main origin/main${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/develop; then
  echo -e "${RED}Error: Remote branch 'origin/develop' does not exist.${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/main; then
  echo -e "${RED}Error: Remote branch 'origin/main' does not exist.${NC}"
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"

echo -e "${YELLOW}Updating local develop...${NC}"
git checkout develop
git pull origin develop

DEVELOP_COMMIT="$(git rev-parse develop)"
ORIGIN_DEVELOP_COMMIT="$(git rev-parse origin/develop)"
if [ "$DEVELOP_COMMIT" != "$ORIGIN_DEVELOP_COMMIT" ]; then
  echo -e "${RED}Error: local develop does not match origin/develop after pull.${NC}"
  exit 1
fi

echo -e "${YELLOW}Running security audit on develop (moderate and above; low permitted)...${NC}"
npm ci

# Call shared audit gate utility
# See docs/development/NPM-AUDIT-ALLOWLIST.md for rationale on any allowlisted advisories
if ! "$SCRIPT_DIR/../lib/check-audit-gate.sh" "" "promote to main"; then
  echo -e "${RED}Error: npm audit found disallowed moderate or higher vulnerabilities in develop. Fix them before syncing to main.${NC}"
  exit 1
fi
echo ""

echo -e "${YELLOW}Updating local main...${NC}"
git checkout main
git pull origin main

MAIN_COMMIT="$(git rev-parse main)"
ORIGIN_MAIN_COMMIT="$(git rev-parse origin/main)"
if [ "$MAIN_COMMIT" != "$ORIGIN_MAIN_COMMIT" ]; then
  echo -e "${RED}Error: local main does not match origin/main after pull.${NC}"
  exit 1
fi

echo -e "${YELLOW}Checking that main can fast-forward to develop...${NC}"
if ! git merge-base --is-ancestor main develop; then
  echo -e "${RED}Error: Fast-forward is not possible (main has commits not in develop).${NC}"
  echo -e "${YELLOW}Commits in main but not develop:${NC}"
  git log develop..main --oneline
  exit 1
fi

if [ "$MAIN_COMMIT" == "$DEVELOP_COMMIT" ]; then
  echo -e "${GREEN}Main already matches develop. Nothing to do.${NC}"
  if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout "$CURRENT_BRANCH"
  fi
  exit 0
fi

echo -e "${YELLOW}Merging develop into main with --ff-only...${NC}"
git merge develop --ff-only

NEW_MAIN_COMMIT="$(git rev-parse main)"
if [ "$NEW_MAIN_COMMIT" != "$DEVELOP_COMMIT" ]; then
  echo -e "${RED}Error: main does not match develop after merge.${NC}"
  exit 1
fi

echo -e "${YELLOW}Pushing main to origin (uses --no-verify like bump-version flow)...${NC}"
if ! git push --no-verify origin main; then
  echo -e "${RED}Error: push to origin/main failed.${NC}"
  echo -e "${YELLOW}Likely causes:${NC}"
  echo -e "${YELLOW}  1. Missing bypass permission for protected branch main${NC}"
  echo -e "${YELLOW}  2. Auth/network issue${NC}"
  echo -e "${YELLOW}If needed, create a PR from develop to main instead.${NC}"
  exit 1
fi

echo -e "${YELLOW}Final verification against origin...${NC}"
git fetch origin
FINAL_MAIN_COMMIT="$(git rev-parse origin/main)"
FINAL_DEVELOP_COMMIT="$(git rev-parse origin/develop)"
if [ "$FINAL_MAIN_COMMIT" != "$FINAL_DEVELOP_COMMIT" ]; then
  echo -e "${RED}Error: origin/main does not match origin/develop after push.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Main now mirrors develop and is pushed to origin${NC}"

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}Returning to original branch: ${CURRENT_BRANCH}${NC}"
  git checkout "$CURRENT_BRANCH"
fi
