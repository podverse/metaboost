# 05 — Adopt run-workspaces CI script

## Scope

Triage Plan 08 PARITY-GAP: Podverse `test:unit` uses `scripts/ci/run-workspaces.mjs`; MetaBoost uses
an explicit `npm run test -w ...` chain.

## ADOPT

1. Port `scripts/ci/run-workspaces.mjs` from Podverse (adapt workspace exclude list:
   `--exclude apps/api --exclude apps/management-api`).
2. Optionally port `scripts/ci/lint-with-summary.mjs` if CI adopts it later (out of scope unless
   needed).
3. Change root `package.json` `test:unit` to Podverse pattern:
   `node scripts/ci/run-workspaces.mjs --script test --all --exclude apps/api --exclude apps/management-api`
4. Document in `commands-from-metaboost-root` rule / `AGENTS.md`.

## Intentional divergence (not ADOPT)

| Item | Class | Notes |
| --- | --- | --- |
| `eslint-plugin-perfectionist` vs `simple-import-sort` | **MB-SPECIFIC** | Pre-existing; both enforce import order |
| Podverse-only Makefiles (`Makefile.local.v4v`, extensions, alpha Jenkins) | **N/A** | No MB analogue |

## Verification

```bash
./scripts/nix/with-env npm run test:unit
```
