#!/bin/bash
# Fast-forward `staging` to match `develop` (triggers the Publish (staging) workflow on push).

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
  echo -e "${YELLOW}Warning: Untracked files detected.${NC}"
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

if ! git show-ref --verify --quiet refs/heads/staging; then
  echo -e "${RED}Error: Local branch 'staging' does not exist.${NC}"
  echo -e "${YELLOW}Run: git checkout -b staging origin/staging${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/staging; then
  echo -e "${RED}Error: Remote branch 'origin/staging' does not exist.${NC}"
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"

echo -e "${YELLOW}Updating local develop...${NC}"
git switch develop
git merge --ff-only refs/remotes/origin/develop

DEVELOP_COMMIT="$(git rev-parse refs/heads/develop)"
ORIGIN_DEVELOP_COMMIT="$(git rev-parse refs/remotes/origin/develop)"
if [ "$DEVELOP_COMMIT" != "$ORIGIN_DEVELOP_COMMIT" ]; then
  echo -e "${RED}Error: local develop does not match origin/develop after pull.${NC}"
  exit 1
fi

echo -e "${YELLOW}Running security audit on develop (moderate and above; low permitted)...${NC}"
npm ci

if ! "$SCRIPT_DIR/../lib/check-audit-gate.sh" "" "promote to staging"; then
  echo -e "${RED}Error: npm audit failed. Fix before syncing to staging.${NC}"
  exit 1
fi
echo ""

echo -e "${YELLOW}Updating local staging...${NC}"
git switch staging
git merge --ff-only refs/remotes/origin/staging

STAGING_COMMIT="$(git rev-parse refs/heads/staging)"
ORIGIN_STAGING_COMMIT="$(git rev-parse refs/remotes/origin/staging)"
if [ "$STAGING_COMMIT" != "$ORIGIN_STAGING_COMMIT" ]; then
  echo -e "${RED}Error: local staging does not match origin/staging after pull.${NC}"
  exit 1
fi

echo -e "${YELLOW}Checking that staging can fast-forward to develop...${NC}"
if ! git merge-base --is-ancestor refs/heads/staging refs/heads/develop; then
  echo -e "${RED}Error: Fast-forward is not possible (staging has commits not in develop).${NC}"
  git log refs/heads/develop..refs/heads/staging --oneline
  exit 1
fi

if [ "$STAGING_COMMIT" == "$DEVELOP_COMMIT" ]; then
  echo -e "${GREEN}Staging already matches develop. Nothing to do.${NC}"
  if [ "$CURRENT_BRANCH" != "staging" ]; then
    git checkout "$CURRENT_BRANCH"
  fi
  exit 0
fi

echo -e "${YELLOW}Merging develop into staging with --ff-only...${NC}"
git merge refs/heads/develop --ff-only

NEW_STAGING_COMMIT="$(git rev-parse refs/heads/staging)"
if [ "$NEW_STAGING_COMMIT" != "$DEVELOP_COMMIT" ]; then
  echo -e "${RED}Error: staging does not match develop after merge.${NC}"
  exit 1
fi

echo -e "${YELLOW}Pushing staging to origin (uses --no-verify)...${NC}"
if ! git push --no-verify origin refs/heads/staging:refs/heads/staging; then
  echo -e "${RED}Error: push to origin/staging failed (permissions or use PR develop→staging).${NC}"
  exit 1
fi

echo -e "${YELLOW}Final verification...${NC}"
git fetch origin
if [ "$(git rev-parse refs/remotes/origin/staging)" != "$(git rev-parse refs/remotes/origin/develop)" ]; then
  echo -e "${RED}Error: origin/staging does not match origin/develop after push.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Staging now mirrors develop and is pushed to origin${NC}"
if [ "$CURRENT_BRANCH" != "staging" ]; then
  git checkout "$CURRENT_BRANCH"
fi
