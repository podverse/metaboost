# 02 — Complete vitest package wiring

## Scope

Pending change adds `vitest.config.ts` for `helpers-requests`, `orm`, and `ui`, extends root
`test:unit`, and adds `test` scripts to `helpers-requests` and `orm` package.json.

**Gap:** `packages/ui/package.json` has no `test` script or vitest devDependencies, but root
`test:unit` invokes `npm run test -w @metaboost/ui`.

## Steps

1. Add to `packages/ui/package.json`:
   - `"test": "vitest run"`
   - devDependencies: `vitest`, `@vitejs/plugin-react`, `jsdom` (match Podverse ui package versions)
2. Confirm `packages/ui/vitest.config.ts` matches Podverse (jsdom, react plugin, include patterns).
3. Confirm `packages/orm/tsconfig.json` excludes `**/*.test.ts` (already in pending diff — KEEP).
4. Optional ALIGN: simplify `helpers-requests/vitest.config.ts` to match Podverse (drop
   `fileParallelism`/`maxWorkers` unless needed for flakiness).

## Verification

```bash
./scripts/nix/with-env npm run test -w @metaboost/helpers-requests
./scripts/nix/with-env npm run test -w @metaboost/orm
./scripts/nix/with-env npm run test -w @metaboost/ui
./scripts/nix/with-env npm run test:unit
```
