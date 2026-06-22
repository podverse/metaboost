---
name: build-order
description: Keep monorepo build order dependency-safe and keep build-order docs in sync when build orchestration changes.
---

# Build Order

Use this skill when you change root build orchestration, workspace build sequencing, or CI/local
validation flows that affect build execution order.

## Canonical sequence

From repo root, build in this order:

1. `npm run build:packages` — `@metaboost/helpers` first, then parallel helper packages, then
   `orm` / `management-orm`, then `helpers-i18n` (see root `package.json` `build:packages` script)
2. `npm run build:apps` — api, management-api, web, sidecars, management-web

For local dev and CI, prefer **`build:packages` then `build:apps`**. Root `npm run build` runs
`npm run build --workspaces --if-present`; do not rely on it alone for a clean first-time build when
package `dist/` outputs are missing.

## Why

Package outputs (`dist/*.d.ts`) are required by downstream workspace builds. If order is broken,
first-time builds can fail with `TS2307` module-resolution errors.

## Keep in sync when build process changes

When changing build order/process, update all relevant sources in the same PR:

- Root `package.json` (`build`, `build:packages`, `build:apps`)
- [AGENTS.md](/AGENTS.md) and [.llm/context/architecture.md](/.llm/context/architecture.md) if the
  documented sequence changes
- **build-order-doc-sync** rule targets (`package.json`, CI workflows)
- Docker/workspace parity: **docker-runtime-workspace-parity** when new packages join `build:packages`

Database bootstrap artifacts: when linear migration SQL changes, regenerate baselines per
**linear-baseline-gz-sync** (not part of npm build, but often touched in the same infra PR).

## Do

- Use explicit workspace ordering for dependency-sensitive package builds.
- Keep root build orchestration readable and staged.
- Update contributor docs whenever orchestration behavior changes.

## Don't

- Do not add packages to apps without ensuring they are built in `build:packages` (or app-local build) first.
- Do not change build sequencing without updating AGENTS.md / architecture context.
