---
name: path-casing-imports
description: Keep import path casing identical to file/directory names so builds pass on Linux and in CI. Use when adding or changing relative imports, or when CI fails with "Cannot find module" for paths that work locally.
version: 1.0.0
---


# Path Casing in Imports

## Why it matters

- **Linux and CI** (e.g. GitHub Actions) use **case-sensitive** filesystems. Imports like `'./components/form/Button'` fail if the directory is actually `Form` (uppercase).
- **macOS** often uses a case-insensitive default FS, so `form` and `Form` can both resolve locally while CI fails with "Cannot find module ... or its corresponding type declarations."
- Fix: use the **exact casing** of every path segment (folders and files) as stored in the repo.

## What to do

1. **When adding or changing relative imports:** Check the real path casing (e.g. `git ls-tree -r --name-only HEAD -- <path>` or the IDE file tree) and use that exact casing in the import string.
2. **When CI fails with module-not-found for a path that works locally:** Treat it as a casing mismatch. Find the actual path (e.g. `git ls-tree` under the package), then update the import to match (e.g. `form/` → `Form/` or vice versa to match the tree). Do **not** rename files/dirs unless the team agrees; prefer updating the imports to match existing names.
3. **When creating new directories/files:** Prefer a single convention and use that same casing in all imports. In this repo, **component directories** under `packages/ui/src/components/` use **lowercase** (e.g. `form`, `bucket`, `layout`, `modal`, `navigation`, `table`).

## Reference

- Cursor rule: **.llm/exports/github-copilot/instructions/path-casing-imports.instructions.md**
- This skill: **.llm/exports/github-copilot/skills/path-casing-imports/SKILL.md**
