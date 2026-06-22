# Monorepo sweep matrix (Metaboost)

## Rollout status (implementation)

- **Tier A:** Root ESLint local rule `nodeNextRelativeImports/require-relative-js-extension` is **on**; packages (except `packages/ui`) and Node-side apps were swept with targeted `eslint --fix` where needed. Verify with `./scripts/nix/with-env npx eslint` over Tier A globs from repo root if needed.
- **Tier C (`packages/ui`):** Extensionless relatives only; rule **off**. Do not sweep to `.js` — breaks Next bundling of `.tsx` sources.
- **Tier B:** **No** `.js` specifier sweep — Next `src` and colocated `e2e` stay extension-flexible per Turbopack constraints ([vercel/next.js#82945](https://github.com/vercel/next.js/issues/82945)).


## Tier A — packages

| Workspace | Tier | Sweep | Lint | Notes |
| --------- | ---- | ----- | ---- | ----- |
| `packages/helpers` | A | | | |
| `packages/helpers-currency` | A | | | |
| `packages/helpers-backend-api` | A | | | |
| `packages/helpers-i18n` | A | | | |
| `packages/helpers-requests` | A | | | |
| `packages/helpers-valkey` | A | | | |
| `packages/metaboost-signing` | A | | | |
| `packages/rss-parser` | A | | | |
| `packages/orm` | A | | | |
| `packages/management-orm` | A | | | |

## Tier C — shared UI package

| Workspace / path | Tier | Sweep | Lint | Notes |
| ---------------- | ---- | ----- | ---- | ----- |
| `packages/ui` | C | | | Extensionless relatives; Next `transpilePackages`; same style as Tier B |

## Tier A — apps

| Workspace | Tier | Sweep | Lint | Notes |
| --------- | ---- | ----- | ---- | ----- |
| `apps/api` | A | | | |
| `apps/management-api` | A | | | |
| `apps/web/sidecar` | A | | | |
| `apps/management-web/sidecar` | A | | | |
| `tools/generate-data` | A | | | |

## Tier B

| Path | Tier | Notes |
| ---- | ---- | ----- |
| `apps/web/src` | B | Extension-flexible |
| `apps/web/e2e` | B | |
| `apps/management-web/src` | B | |
| `apps/management-web/e2e` | B | |

## Verification

```bash
./scripts/nix/with-env npm run build -w @metaboost/web
./scripts/nix/with-env npm run build -w @metaboost/management-web
```
