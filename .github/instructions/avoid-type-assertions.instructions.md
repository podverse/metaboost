---
description: "Avoid type assertions (as) when a better approach exists; prefer types, narrowing, type guards."
applyTo:
  - "**/*.ts"
  - "**/*.tsx"
---

# Avoid Type Assertions

Avoid `as` (type assertions) when there is a better way. Prefer: better types, optional chaining, type guards, or narrowing. Allowed: import aliases, `as const`, and rare documented escape hatches.
