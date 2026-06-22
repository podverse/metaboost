# 08 — Build / Package / Lint Config Triage

## Scope

This theme triages MetaBoost's build, packaging, and lint configuration changes — the toolchain that
governs how the monorepo builds, lints, and tests. Podverse is the reference for these conventions
(ESM tiering, lint rules, vitest layout, Linux-canonical lockfile).

## Changed paths

- `package.json` (root — script/dep changes), `package-lock.json`
- `eslint.config.mjs` (modified — new rules added per stat), `eslint-rules/` (new; rule source owned
  by Plan 07, wiring owned here)
- `packages/helpers-requests/package.json`, `packages/orm/package.json`,
  `packages/metaboost-signing/package.json`
- `packages/orm/tsconfig.json`
- New vitest configs (untracked): `packages/helpers-requests/vitest.config.ts`,
  `packages/orm/vitest.config.ts`, `packages/ui/vitest.config.ts`

## Triage method

1. Diff root `package.json` scripts against Podverse's. Confirm script names/orchestration
   (`build:packages`, `lint`, `lint:fix`, `test:unit`, `test:e2e:api`, etc.) follow Podverse
   conventions. Flag any script that referenced removed systems (exports/changelog).
2. Diff `eslint.config.mjs` and confirm new rules align with Podverse's ESLint setup and the local
   `eslint-rules/` (cross-check Plan 07). Confirm tiered import-specifier enforcement matches the
   `import-specifiers-tiered` rule shared with Podverse.
3. For new `vitest.config.ts` files, confirm they match Podverse's per-package vitest conventions
   (test layout, environment, include/exclude) — Podverse drives `test:unit` across packages.
4. For `tsconfig.json` and per-package `package.json` changes, confirm ESM/NodeNext settings and
   workspace dependency declarations follow Podverse tier conventions
   (`architecture-tier-dependencies`).
5. `package-lock.json`: confirm it is the **Linux-canonical** lockfile (per `LOCKFILE-LINUX.md`) and
   in sync with all workspace `package.json` files. This is mostly an ops-flow check (was the lockfile
   regenerated correctly), not a line-by-line review.

## Expected decisions

| File group                         | Decision | Notes                                                |
| ---------------------------------- | -------- | ---------------------------------------------------- |
| root `package.json` scripts        | TBD      | KEEP if aligned + no removed-system refs              |
| `eslint.config.mjs` + `eslint-rules`| TBD     | KEEP/ALIGN vs Podverse lint setup                     |
| per-package `vitest.config.ts`     | TBD      | KEEP if matches Podverse vitest conventions           |
| `tsconfig.json` + pkg deps         | TBD      | KEEP/ALIGN vs tier conventions                        |
| `package-lock.json`                | TBD      | KEEP if Linux-canonical + in sync; ALIGN otherwise    |

## Decisions

**Executed:** 2026-06-21  
**Stale refs:** no CHANGELOG / llm-exports in `package.json` or workspace package.json files.

### Root `package.json`

| Path / change | Decision | Notes |
| --- | --- | --- |
| Removed `llm:exports:*` / `llm:vendors` scripts | **KEEP** | Aligns with Plan 01 exports removal |
| `test:unit` adds helpers-requests, orm, ui | **KEEP** | Matches new vitest configs and tests |
| `lint-staged` devDependency + config | **ALIGN** | Podverse has none; remove with dev-scripts-align |
| Script orchestration (`build:packages`, `lint`, `test:e2e:*`) | **KEEP** | MB-specific workspace lists; same intent as Podverse |
| `test:unit` explicit chain vs PV `run-workspaces.mjs` | **PARITY-GAP** | Podverse uses `scripts/ci/run-workspaces.mjs --all`; candidate for Plan 09 |

### `eslint.config.mjs` + `eslint-rules/`

| Path / change | Decision | Notes |
| --- | --- | --- |
| `require-relative-js-extension` wiring (tier A/B/C) | **KEEP** | Matches Podverse import-specifiers-tiered enforcement |
| Stale `scripts/llm/**` override block | **ALIGN** | Delete — directory removed |
| `eslint-plugin-perfectionist` vs PV `simple-import-sort` | **PARITY-GAP** | Pre-existing MB choice; not changed in pending diff |
| `eslint-plugin-storybook` flat config | **KEEP** | MB Storybook in `@metaboost/ui`; PV may differ |
| Ignores `**/.llm/**` vs PV `**/.llm/plans/**` | **KEEP** | Broader ignore acceptable for MB |

### Vitest configs (new)

| Package | Decision | Notes |
| --- | --- | --- |
| `helpers-requests/vitest.config.ts` | **KEEP** | Node env; extra serial settings vs PV — acceptable |
| `orm/vitest.config.ts` | **KEEP** | Node env; no `@orm` alias needed (tests use relative imports) |
| `ui/vitest.config.ts` | **KEEP** | jsdom + react plugin; aligns with Podverse ui config |
| `packages/ui/package.json` missing `test` + vitest deps | **ALIGN** | Root `test:unit` will fail until fixed |

### Per-package `package.json` / tsconfig

| Path | Decision | Notes |
| --- | --- | --- |
| `helpers-requests` + `orm` add `test` + vitest | **KEEP** | Correct wiring |
| `orm/tsconfig.json` exclude `**/*.test.ts` | **KEEP** | Standard pattern |
| `metaboost-signing` remove CHANGELOG from `files` | **KEEP** | Plan 02 |

### `package-lock.json`

| Item | Decision | Notes |
| --- | --- | --- |
| web-push / `@types/web-push` (api) | **KEEP** | Feature deps |
| vitest/jsdom/cssom tree additions | **KEEP** | From new package tests |
| Linux-canonical optional deps | **ALIGN** | Operator runs `update-lockfile-linux.sh` after dep changes on macOS |

**Stage-2 spawned:** `.llm/plans/active/metaboost-build-config-align/`

## Stage-2 spawn rule

If build/lint/test config drifts from Podverse, create
`.llm/plans/active/metaboost-build-config-align/` with exact edits. If the lockfile is not
Linux-canonical or out of sync, that belongs in a dedicated stage-2 plan referencing
`LOCKFILE-LINUX.md`.

## Verification (for the operator, later)

```bash
cd /Users/mitcheldowney/repos/pv/metaboost && ./scripts/nix/with-env npm run lint
cd /Users/mitcheldowney/repos/pv/metaboost && ./scripts/nix/with-env npm run build
```
