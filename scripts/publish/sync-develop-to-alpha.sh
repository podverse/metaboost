#!/bin/bash
# Sync alpha branch to match develop (fast-forward merge only).
# Keeps alpha as a strict mirror of develop for Publish Alpha trigger flow.

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

if ! git show-ref --verify --quiet refs/heads/alpha; then
  echo -e "${RED}Error: Local branch 'alpha' does not exist.${NC}"
  echo -e "${YELLOW}Run: git checkout -b alpha origin/alpha${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/develop; then
  echo -e "${RED}Error: Remote branch 'origin/develop' does not exist.${NC}"
  exit 1
fi

if ! git show-ref --verify --quiet refs/remotes/origin/alpha; then
  echo -e "${RED}Error: Remote branch 'origin/alpha' does not exist.${NC}"
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

echo -e "${YELLOW}Updating local alpha...${NC}"
git checkout alpha
git pull origin alpha

ALPHA_COMMIT="$(git rev-parse alpha)"
ORIGIN_ALPHA_COMMIT="$(git rev-parse origin/alpha)"
if [ "$ALPHA_COMMIT" != "$ORIGIN_ALPHA_COMMIT" ]; then
  echo -e "${RED}Error: local alpha does not match origin/alpha after pull.${NC}"
  exit 1
fi

echo -e "${YELLOW}Checking that alpha can fast-forward to develop...${NC}"
if ! git merge-base --is-ancestor alpha develop; then
  echo -e "${RED}Error: Fast-forward is not possible (alpha has commits not in develop).${NC}"
  echo -e "${YELLOW}Commits in alpha but not develop:${NC}"
  git log develop..alpha --oneline
  exit 1
fi

if [ "$ALPHA_COMMIT" == "$DEVELOP_COMMIT" ]; then
  echo -e "${GREEN}Alpha already matches develop. Nothing to do.${NC}"
  if [ "$CURRENT_BRANCH" != "alpha" ]; then
    git checkout "$CURRENT_BRANCH"
  fi
  exit 0
fi

echo -e "${YELLOW}Merging develop into alpha with --ff-only...${NC}"
git merge develop --ff-only

NEW_ALPHA_COMMIT="$(git rev-parse alpha)"
if [ "$NEW_ALPHA_COMMIT" != "$DEVELOP_COMMIT" ]; then
  echo -e "${RED}Error: alpha does not match develop after merge.${NC}"
  exit 1
fi

echo -e "${YELLOW}Pushing alpha to origin (uses --no-verify like bump-version flow)...${NC}"
if ! git push --no-verify origin alpha; then
  echo -e "${RED}Error: push to origin/alpha failed.${NC}"
  echo -e "${YELLOW}Likely causes:${NC}"
  echo -e "${YELLOW}  1. Missing bypass permission for protected branch alpha${NC}"
  echo -e "${YELLOW}  2. Auth/network issue${NC}"
  echo -e "${YELLOW}If needed, create a PR from develop to alpha instead.${NC}"
  exit 1
fi

echo -e "${YELLOW}Final verification against origin...${NC}"
git fetch origin
FINAL_ALPHA_COMMIT="$(git rev-parse origin/alpha)"
FINAL_DEVELOP_COMMIT="$(git rev-parse origin/develop)"
if [ "$FINAL_ALPHA_COMMIT" != "$FINAL_DEVELOP_COMMIT" ]; then
  echo -e "${RED}Error: origin/alpha does not match origin/develop after push.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Alpha now mirrors develop and is pushed to origin${NC}"

if [ "$CURRENT_BRANCH" != "alpha" ]; then
  echo -e "${YELLOW}Returning to original branch: ${CURRENT_BRANCH}${NC}"
  git checkout "$CURRENT_BRANCH"
fi
