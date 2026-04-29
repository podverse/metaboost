---
description: "Keep import path casing identical to actual file/directory names for Linux and CI"
applyTo:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---

# Path Casing in Imports

**Import paths must match the exact casing of the files and directories on disk.**

- Linux and CI (e.g. GitHub Actions) use **case-sensitive** filesystems. A path like `'./components/form/Button'` will fail if the directory is actually named `Form` (uppercase).
- macOS can hide the bug because the default filesystem is often case-insensitive, so `form` and `Form` resolve to the same directory locally but not in CI.
- When adding or changing relative imports, verify that every segment of the path (each folder and file name) uses the **exact same casing** as in the repository (e.g. `git ls-tree` or your IDE file tree). Do not rely on "it works on my machine."
- **Component directories** under `packages/ui/src/components/` use **lowercase** names (e.g. `form`, `bucket`, `layout`, `modal`, `navigation`, `table`). Use that casing in imports.

Example: if the repo has `packages/ui/src/components/form/Button/Button.tsx`, use `from './components/form/Button/Button'` or `from '../../form/Button/Button'`, not `./components/Form/...`.
