#!/bin/bash
# Sync beta branch to match develop (fast-forward merge only).
# Keeps beta as a strict mirror of develop for Publish Beta trigger flow.

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

if ! git show-ref --verify --quiet refs/heads/beta; then
  echo -e "${RED}Error: Local branch 'beta' does not exist.${NC}"
  echo -e "${YELLOW}Run: git checkout -b beta origin/beta${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/develop; then
  echo -e "${RED}Error: Remote branch 'origin/develop' does not exist.${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/beta; then
  echo -e "${RED}Error: Remote branch 'origin/beta' does not exist.${NC}"
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

echo -e "${YELLOW}Updating local beta...${NC}"
git checkout beta
git pull origin beta

BETA_COMMIT="$(git rev-parse beta)"
ORIGIN_BETA_COMMIT="$(git rev-parse origin/beta)"
if [ "$BETA_COMMIT" != "$ORIGIN_BETA_COMMIT" ]; then
  echo -e "${RED}Error: local beta does not match origin/beta after pull.${NC}"
  exit 1
fi

echo -e "${YELLOW}Checking that beta can fast-forward to develop...${NC}"
if ! git merge-base --is-ancestor beta develop; then
  echo -e "${RED}Error: Fast-forward is not possible (beta has commits not in develop).${NC}"
  echo -e "${YELLOW}Commits in beta but not develop:${NC}"
  git log develop..beta --oneline
  exit 1
fi

if [ "$BETA_COMMIT" == "$DEVELOP_COMMIT" ]; then
  echo -e "${GREEN}Beta already matches develop. Nothing to do.${NC}"
  if [ "$CURRENT_BRANCH" != "beta" ]; then
    git checkout "$CURRENT_BRANCH"
  fi
  exit 0
fi

echo -e "${YELLOW}Merging develop into beta with --ff-only...${NC}"
git merge develop --ff-only

NEW_BETA_COMMIT="$(git rev-parse beta)"
if [ "$NEW_BETA_COMMIT" != "$DEVELOP_COMMIT" ]; then
  echo -e "${RED}Error: beta does not match develop after merge.${NC}"
  exit 1
fi

echo -e "${YELLOW}Pushing beta to origin (uses --no-verify like bump-version flow)...${NC}"
if ! git push --no-verify origin beta; then
  echo -e "${RED}Error: push to origin/beta failed.${NC}"
  echo -e "${YELLOW}Likely causes:${NC}"
  echo -e "${YELLOW}  1. Missing bypass permission for protected branch beta${NC}"
  echo -e "${YELLOW}  2. Auth/network issue${NC}"
  echo -e "${YELLOW}If needed, create a PR from develop to beta instead.${NC}"
  exit 1
fi

echo -e "${YELLOW}Final verification against origin...${NC}"
git fetch origin
FINAL_BETA_COMMIT="$(git rev-parse origin/beta)"
FINAL_DEVELOP_COMMIT="$(git rev-parse origin/develop)"
if [ "$FINAL_BETA_COMMIT" != "$FINAL_DEVELOP_COMMIT" ]; then
  echo -e "${RED}Error: origin/beta does not match origin/develop after push.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Beta now mirrors develop and is pushed to origin${NC}"

if [ "$CURRENT_BRANCH" != "beta" ]; then
  echo -e "${YELLOW}Returning to original branch: ${CURRENT_BRANCH}${NC}"
  git checkout "$CURRENT_BRANCH"
fi
