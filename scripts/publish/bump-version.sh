#!/bin/bash
# Bump version across root and all workspace package.json files.
# Does not publish (no npm publish or image push).
# Commit and push are automatic; uses --no-verify to bypass git hooks.
# Requires: npm, node, git.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo -e "${YELLOW}Running security audit (moderate and above; low permitted)...${NC}"

# Call shared audit gate utility
# See docs/development/NPM-AUDIT-ALLOWLIST.md for rationale on any allowlisted advisories
if ! "$SCRIPT_DIR/../lib/check-audit-gate.sh" "" "release"; then
  echo -e "${RED}Error: npm audit found disallowed moderate or higher vulnerabilities. Fix them before bumping version.${NC}"
  exit 1
fi
echo ""

# Current version from root package.json
CURRENT_VERSION=$(node --input-type=module -e "import { readFileSync } from 'fs'; const pkg = JSON.parse(readFileSync('./package.json', 'utf8')); console.log(pkg.version)")
echo -e "Current version: ${GREEN}$CURRENT_VERSION${NC}"
echo ""
read -p "Enter next version (e.g., 1.2.3): " VERSION

if [[ -z "$VERSION" ]]; then
  echo -e "${RED}Error: No version entered. Aborting.${NC}"
  exit 1
fi

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Error: Invalid version format. Expected X.Y.Z (e.g., 1.2.3)${NC}"
  exit 1
fi

CHANGELOG_DIR="$REPO_ROOT/docs/development/CHANGELOGS"
CHANGELOG_FILE="$CHANGELOG_DIR/$VERSION.md"

mkdir -p "$CHANGELOG_DIR"
if [[ ! -f "$CHANGELOG_FILE" ]]; then
  cat > "$CHANGELOG_FILE" << EOF
# Changelog $VERSION

_Update this file continuously during development for version $VERSION._

## Highlights

- Add notable changes for this version.
EOF
  echo -e "${GREEN}Created changelog file:${NC} $CHANGELOG_FILE"
fi

CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}Bumping version to $VERSION on branch '$CURRENT_BRANCH'...${NC}"

# Update root
npm version "$VERSION" --no-git-tag-version

# Update workspaces (from root package.json; npm query .workspace can omit .location on some npm versions)
WORKSPACES=$(node --input-type=module -e "
import { readFileSync, readdirSync, accessSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
const w = pkg.workspaces;
const list = Array.isArray(w) ? w : (w ? [w] : []);
const expanded = [];
for (const entry of list) {
  if (entry.includes('*')) {
    const [prefix, suffix] = entry.split('*');
    for (const name of readdirSync(prefix, { withFileTypes: true })) {
      if (name.isDirectory()) {
        const path = prefix + name.name + (suffix || '');
        try { accessSync(path + '/package.json'); expanded.push(path); } catch (_) {}
      }
    }
  } else {
    expanded.push(entry);
  }
}
console.log(expanded.join('\n'));
")
for ws in $WORKSPACES; do
  [[ -z "$ws" ]] && continue
  echo "  Updating $ws..."
  cd "$REPO_ROOT/$ws"
  npm version "$VERSION" --no-git-tag-version --allow-same-version
done

cd "$REPO_ROOT"

# Regenerate lockfile under Linux so CI (Linux) gets correct optional deps
echo -e "${YELLOW}Regenerating package-lock.json under Linux (Docker)...${NC}"
bash "$REPO_ROOT/scripts/development/update-lockfile-linux.sh"

# Stage changes (root + all workspaces from same list used for bumping)
git add package.json package-lock.json
for ws in $WORKSPACES; do
  git add "$ws/package.json"
  if [[ -f "$REPO_ROOT/$ws/package-lock.json" ]]; then
    git add "$ws/package-lock.json"
  fi
done
git add "$CHANGELOG_FILE"

git commit --no-verify -m "chore: bump version to $VERSION"
echo -e "${YELLOW}Pushing to origin/$CURRENT_BRANCH...${NC}"
git push --no-verify origin "$CURRENT_BRANCH"

echo -e "${GREEN}✓ Version bumped to $VERSION and pushed${NC}"
