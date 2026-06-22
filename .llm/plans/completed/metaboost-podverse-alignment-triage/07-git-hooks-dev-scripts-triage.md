# 07 — Git Hooks + Dev Scripts Triage

## Scope

This theme triages MetaBoost's developer-workflow tooling: git hooks, the feature-start helper, local
env setup, the version bump script, env-override tooling, a new markdown link normalizer, and a new
local ESLint rules directory. These shape the "process around the code" for contributors.

Podverse is the reference for these dev-workflow scripts and hooks.

## Changed paths

- `scripts/git-hooks/pre-commit` (modified — lines removed), `scripts/git-hooks/pre-push` (modified)
- `scripts/start-feature.sh` (modified — large diff per stat)
- `scripts/local-env/setup.sh` (modified)
- `scripts/publish/bump-version.sh` (modified — changelog hooks owned by Plan 02; here review the
  rest: lockfile-linux step, version propagation)
- `scripts/env-overrides/home-override-env-files.inc.sh`,
  `scripts/env-overrides/write-home-override-stubs.rb` (modified)
- `scripts/development/normalize-markdown-links.mjs` (new)
- `eslint-rules/` (new — local custom ESLint rules; coordinate scope with Plan 08 which owns
  `eslint.config.mjs`)

## Triage method

1. Diff each modified script against its Podverse counterpart (`podverse/scripts/...`) where one
   exists. Classify KEEP if behavior matches the Podverse process; ALIGN if drift.
   - `pre-commit` / `pre-push`: confirm the removed lines were exports/changelog guards (now
     obsolete) and that remaining checks match Podverse's hooks.
   - `start-feature.sh`: confirm branch-naming/flow matches Podverse's gitflow.
   - `local-env/setup.sh`: confirm env seeding aligns with Podverse's local env setup conventions.
2. `normalize-markdown-links.mjs`: determine whether Podverse has an equivalent (it has a
   `markdown-formatting` rule and documentation link policy). If MetaBoost-only, classify KEEP and
   record as a candidate for Podverse adoption in Plan 09.
3. `eslint-rules/`: confirm these custom rules correspond to documented conventions and whether
   Podverse has equivalents (record gap for Plan 09). Wiring into `eslint.config.mjs` is verified in
   Plan 08.
4. Confirm no script still references removed systems (exports/changelog).

## Expected decisions

| File group                          | Decision | Notes                                               |
| ----------------------------------- | -------- | --------------------------------------------------- |
| `pre-commit` / `pre-push`           | TBD      | KEEP if removed lines were obsolete guards            |
| `start-feature.sh`                  | TBD      | KEEP/ALIGN vs Podverse gitflow                        |
| `local-env/setup.sh`                | TBD      | KEEP/ALIGN vs Podverse env setup                      |
| `bump-version.sh` (non-changelog)   | TBD      | KEEP if lockfile-linux + version steps match          |
| env-override tooling                | TBD      | KEEP/ALIGN vs Podverse                                 |
| `normalize-markdown-links.mjs`      | KEEP     | note for Plan 09 (Podverse adoption candidate)        |
| `eslint-rules/`                     | KEEP     | confirm wiring (Plan 08); note for Plan 09            |

## Decisions

**Executed:** 2026-06-21  
**Stale refs check:** `rg` on `scripts/` — no CHANGELOG / llm-exports / guard-exports references.

### Git hooks

| Path | Decision | Notes |
| --- | --- | --- |
| `pre-commit` (removed guard-exports block) | **KEEP** | Obsolete exports guard removal aligns with Plan 01 |
| `pre-commit` (lint-staged still installed) | **ALIGN** | Podverse **removed** pre-commit entirely; `install-hooks.sh` runs `rm -f pre-commit` |
| `pre-push` (+ `llm/` branch pattern) | **KEEP** | Matches Podverse after pending diff |
| `install-hooks.sh` | **ALIGN** | MB copies pre-commit + uses `.git/hooks`; PV uses `git rev-parse --git-path`, CI skip, pre-push only |

### Dev scripts

| Path | Decision | Notes |
| --- | --- | --- |
| `start-feature.sh` | **KEEP** | Matches Podverse flow (llm type, history scaffold disabled); MB fork slug `podverse/metaboost` |
| `local-env/setup.sh` (WEBPUSH block) | **KEEP** | Same pattern as Podverse notifications handling; feature-specific keys |
| `bump-version.sh` (changelog removal) | **KEEP** | Plan 02; lockfile-linux step matches Podverse |
| `bump-version.sh` (audit allowlist) | **ALIGN** | PV allows advisory `1117015`; MB strict `""` — verify on next release bump |
| `bump-version.sh` (workspace discovery) | **KEEP** | Node expansion vs PV `jq`/`npm query` — equivalent intent, MB-specific |
| `env-overrides/*` (+ notifications.env) | **KEEP** | MB home-override flow; Podverse uses `scripts/local-env/prepare-overrides.sh` (different layout, documented) |

### New / parity tooling

| Path | Decision | Notes |
| --- | --- | --- |
| `normalize-markdown-links.mjs` | **KEEP** | **Podverse has equivalent** (not MB-only); trivial diff; commit untracked copy |
| `eslint-rules/require-relative-js-extension.mjs` | **KEEP** | **Podverse has same rule**; wiring in Plan 08 |

### MetaBoost-only vs Podverse (Plan 09 inputs)

| Item | Notes |
| --- | --- |
| `scripts/env-overrides/` layout | MB-specific; PV uses `local-env/prepare-overrides.sh` |
| Root `lint-staged` in `package.json` | MB only; remove when pre-commit dropped (coordinate Plan 08) |
| `pre-commit` hook file | PV deleted; MB should align |

**Stage-2 spawned:** `.llm/plans/active/metaboost-dev-scripts-align/`

## Stage-2 spawn rule

If scripts/hooks drift from Podverse, create `.llm/plans/active/metaboost-dev-scripts-align/` with
exact edits. Record MetaBoost-only tooling (link normalizer, custom eslint rules) as inputs to Plan
09's parity set.

## Verification (for the operator, later)

```bash
rg -n "CHANGELOG|llm-exports|export-from-cursor" /Users/mitcheldowney/repos/pv/metaboost/scripts || echo "scripts clean"
```
