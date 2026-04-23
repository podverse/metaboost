# Phase B - Web Vitest Harness

## Scope

- Add `vitest` devDependency aligned with `@metaboost/helpers` (e.g. `^4.1.4`).
- Add `test` / `test:watch` scripts to [`apps/web/package.json`](/Users/mitcheldowney/repos/pv/metaboost/apps/web/package.json).
- Add [`apps/web/vitest.config.ts`](/Users/mitcheldowney/repos/pv/metaboost/apps/web/vitest.config.ts): `environment: 'node'`, `include: ['src/**/*.test.ts']`.

## Verification

- `./scripts/nix/with-env npm run test -w @metaboost/web`
