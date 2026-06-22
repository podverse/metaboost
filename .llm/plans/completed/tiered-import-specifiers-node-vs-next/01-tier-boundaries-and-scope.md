# Tier boundaries and scope (Metaboost)

## Tier A — NodeNext `.js` specifiers (enforce)

| Path pattern | Notes |
| ------------ | ----- |
| `packages/**/*.ts`, `packages/**/*.tsx` **except** `packages/ui/**` | Workspace packages (`packages/ui` is **Tier C**) |
| `apps/api/**/*.ts`, `apps/api/**/*.tsx` | Main API |
| `apps/management-api/**/*.ts`, `apps/management-api/**/*.tsx` | Management API |
| `apps/web/sidecar/**/*.ts`, `apps/web/sidecar/**/*.tsx` | Web sidecar |
| `apps/management-web/sidecar/**/*.ts`, `apps/management-web/sidecar/**/*.tsx` | Management sidecar |
| `tools/**/*.ts`, `tools/**/*.tsx` | e.g. `tools/generate-data` |

## Tier B — Next.js app bundles

| Path pattern | Notes |
| ------------ | ----- |
| `apps/web/src/**` | Next web |
| `apps/management-web/src/**` | Next management-web |
| `apps/web/e2e/**` | Playwright |
| `apps/management-web/e2e/**` | Playwright |

## Tier C — `packages/ui` (extensionless relatives; ESLint rule off)

| Path pattern | Notes |
| ------------ | ----- |
| `packages/ui/**` | Shared UI transpiled by Next consumers; **no** `.js` suffix on relatives |

## Tier A package workspaces

`packages/helpers`, `packages/helpers-currency`, `packages/helpers-backend-api`,
`packages/helpers-i18n`, `packages/helpers-requests`, `packages/helpers-valkey`,
`packages/metaboost-signing`, `packages/rss-parser`, `packages/orm`,
`packages/management-orm`.

**Tier C package:** `packages/ui`.

Tier A apps: `apps/api`, `apps/management-api`, sidecars under `apps/web/sidecar`,
`apps/management-web/sidecar`.

Tier B: `apps/web` and `apps/management-web` **src** (and e2e) only.
