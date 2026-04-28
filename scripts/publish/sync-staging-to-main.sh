#!/bin/bash
# Fast-forward `main` to match `staging` (triggers Publish (main) — promote-only, no app rebuild).
# Intended flow: sync develop -> staging (build in GH), then this script: staging -> main (RTM).
# Do not use develop -> main; `main` should only advance from the pre-built staging line.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

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

if ! git show-ref --verify --quiet refs/heads/staging; then
  echo -e "${RED}Error: Local branch 'staging' does not exist.${NC}"
  echo -e "${YELLOW}Run: git checkout -b staging origin/staging${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/heads/main; then
  echo -e "${RED}Error: Local branch 'main' does not exist.${NC}"
  echo -e "${YELLOW}Run: git checkout -b main origin/main${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/staging; then
  echo -e "${RED}Error: Remote branch 'origin/staging' does not exist.${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/main; then
  echo -e "${RED}Error: Remote branch 'origin/main' does not exist.${NC}"
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"

echo -e "${YELLOW}Updating local staging...${NC}"
git switch staging
git merge --ff-only refs/remotes/origin/staging

STAGING_COMMIT="$(git rev-parse refs/heads/staging)"
ORIGIN_STAGING_COMMIT="$(git rev-parse refs/remotes/origin/staging)"
if [ "$STAGING_COMMIT" != "$ORIGIN_STAGING_COMMIT" ]; then
  echo -e "${RED}Error: local staging does not match origin/staging after pull.${NC}"
  exit 1
fi

echo -e "${YELLOW}Running security audit on staging (moderate and above; low permitted)...${NC}"
npm ci

# See docs/development/NPM-AUDIT-ALLOWLIST.md
if ! "$SCRIPT_DIR/../lib/check-audit-gate.sh" "" "promote to main (staging to main)"; then
  echo -e "${RED}Error: npm audit found disallowed moderate or higher vulnerabilities. Fix them before promoting to main.${NC}"
  exit 1
fi
echo ""

echo -e "${YELLOW}Updating local main...${NC}"
git switch main
git merge --ff-only refs/remotes/origin/main

MAIN_COMMIT="$(git rev-parse refs/heads/main)"
ORIGIN_MAIN_COMMIT="$(git rev-parse refs/remotes/origin/main)"
if [ "$MAIN_COMMIT" != "$ORIGIN_MAIN_COMMIT" ]; then
  echo -e "${RED}Error: local main does not match origin/main after pull.${NC}"
  exit 1
fi

echo -e "${YELLOW}Checking that main can fast-forward to staging...${NC}"
if ! git merge-base --is-ancestor refs/heads/main refs/heads/staging; then
  echo -e "${RED}Error: Fast-forward is not possible (main is not an ancestor of staging or branches diverged).${NC}"
  echo -e "${YELLOW}Commits in main but not in staging:${NC}"
  git log refs/heads/staging..refs/heads/main --oneline
  exit 1
fi

if [ "$MAIN_COMMIT" == "$STAGING_COMMIT" ]; then
  echo -e "${GREEN}Main already matches staging. Nothing to do.${NC}"
  if [ "$CURRENT_BRANCH" != "main" ]; then
    git checkout "$CURRENT_BRANCH"
  fi
  exit 0
fi

echo -e "${YELLOW}Merging staging into main with --ff-only...${NC}"
git merge refs/heads/staging --ff-only

NEW_MAIN_COMMIT="$(git rev-parse refs/heads/main)"
if [ "$NEW_MAIN_COMMIT" != "$STAGING_COMMIT" ]; then
  echo -e "${RED}Error: main does not match staging after merge.${NC}"
  exit 1
fi

echo -e "${YELLOW}Pushing main to origin (uses --no-verify like bump-version flow)...${NC}"
if ! git push --no-verify origin refs/heads/main:refs/heads/main; then
  echo -e "${RED}Error: push to origin/main failed.${NC}"
  echo -e "${YELLOW}Likely causes: bypass permission for main, or auth. Use a PR from staging to main if needed.${NC}"
  exit 1
fi

echo -e "${YELLOW}Final verification against origin...${NC}"
git fetch origin
FINAL_MAIN_COMMIT="$(git rev-parse refs/remotes/origin/main)"
FINAL_STAGING_COMMIT="$(git rev-parse refs/remotes/origin/staging)"
if [ "$FINAL_MAIN_COMMIT" != "$FINAL_STAGING_COMMIT" ]; then
  echo -e "${RED}Error: origin/main does not match origin/staging after push.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Main now mirrors staging and is pushed to origin${NC}"

if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}Returning to original branch: ${CURRENT_BRANCH}${NC}"
  git checkout "$CURRENT_BRANCH"
fi
