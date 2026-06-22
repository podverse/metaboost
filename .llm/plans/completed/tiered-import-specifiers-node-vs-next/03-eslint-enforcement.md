# ESLint enforcement (Metaboost)

## Approach: local rule (not `import-x/extensions`)

`eslint-plugin-import-x`’s `import-x/extensions` resolves TypeScript on disk and conflicts with **NodeNext** (specifiers use `.js` while files are `.ts`). This repo instead uses a **local ESLint rule** (kept in sync with Podverse):

- **File:** [eslint-rules/require-relative-js-extension.mjs](/eslint-rules/require-relative-js-extension.mjs)
- **Plugin id:** `nodeNextRelativeImports`
- **Rule id:** `require-relative-js-extension`

The rule uses the filesystem to distinguish **sibling** modules (`.js` after `.ts`) from **directory barrels** (`/index.js`).

## Wiring

Root [eslint.config.mjs](/eslint.config.mjs):

- **Tier A (error):** `packages/**/*.{ts,tsx}`, `apps/api/**`, `apps/management-api/**`, `apps/web/sidecar/**`, `apps/management-web/sidecar/**`, `tools/**/*.{ts,tsx}`, `scripts/**/*.{ts,mts}`
- **Tier C (off):** `packages/ui/**/*.{ts,tsx}` — extensionless relatives (bundler-transpiled shared UI)
- **Tier B (off):** `apps/web/src/**`, `apps/management-web/src/**`, `apps/web/e2e/**`, `apps/management-web/e2e/**`

## Tier C wiring note

The **`packages/ui`** override must register **only** `rules` (rule **off**). Do not repeat `plugins.nodeNextRelativeImports` in that block — Tier A already attaches the plugin to `packages/**/*`, and duplicating the plugin object causes ESLint **“Cannot redefine plugin”**.

## Interaction with **`perfectionist/sort-imports`**

Keep sort order and this rule compatible—run `npm run lint:fix`. Tier C and Tier B override blocks must follow Tier A in flat config.

## Verification

```bash
./scripts/nix/with-env npm run lint
```
