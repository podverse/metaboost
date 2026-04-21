# Execution Order

1. **Phase A - Close Phase 2/3 gaps** (`01-close-phase2-3-gaps.md`)
   - Replay nonce store behavior and bucket-effective null lookup branches.
2. **Phase B - Web Vitest harness** (`02-web-vitest-harness.md`)
   - Depends on Phase A being acceptable to merge first (can parallelize only if CI split).
3. **Phase C - Expand web lib unit tests** (`03-expand-web-lib-unit-tests.md`)
   - Depends on Phase B so `npm run test -w @metaboost/web` works.
4. **Phase D - Optional helper workspaces** (`04-optional-helpers-workspaces.md`)
   - Optional after Phase C; adds vitest harness + pure-logic tests to selected `@metaboost/helpers-*` packages.

## Parallelization

- Run phases sequentially unless noted in each phase file.
