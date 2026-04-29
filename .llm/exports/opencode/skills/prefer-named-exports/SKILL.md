---
name: prefer-named-exports
description: >-
  Prefer named exports in TypeScript/ESM modules; avoid default exports when a named export
  is sufficient. Use in Metaboost and Podverse when adding or editing modules, API routes, worker
  commands, packages, and app code. Framework-required defaults are the exception.
version: 1.0.0
---


# Prefer named exports

## When to use

- Creating or changing `.ts` / `.tsx` modules, `packages/*`, and app code in this monorepo.
- Refactoring imports; choosing export style for a new function, component, or command.

## Rules

- **Prefer** `export function name`, `export const name`, and `export type` / `export { x }` so names stay stable at import sites and refactors are easier to trace.
- **Avoid** `export default` for ordinary modules when there is a single main export: use a **named** export with a clear, stable name.

## Exceptions (defaults are fine)

- **Next.js (App Router)**: `page.tsx`, `layout.tsx`, and similar files that the framework **requires** as the default export.
- **Stricter framework contracts**: e.g. Storybook or tooling that only accepts `export default` (prefer named exports in the same file for everything else, or a thin default wrapper that re-exports a named symbol).
- **Generated or third-party patterns**: match the existing file’s style when the file is not yours to own.

## Imports

- Use `import { foo } from './bar.js'`, not `import foo from './bar.js'`, for named exports.
- Re-exporting: `export { foo } from './bar.js'` in barrels instead of re-exporting a default with an alias, when possible.

## Related

- ESM: `.js` extension in import paths (see repo `tsconfig` / `.cursorrules` stack notes). The Podverse monorepo has the same skill for cross-repo consistency.
