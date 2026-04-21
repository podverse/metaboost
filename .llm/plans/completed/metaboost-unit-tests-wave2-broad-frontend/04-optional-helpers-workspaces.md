# Phase D - Optional Helper Workspaces

## Scope

Add minimal Vitest harness and small pure-logic suites to high-value packages:

- [`packages/helpers-valkey`](/Users/mitcheldowney/repos/pv/metaboost/packages/helpers-valkey) — `parseValkeyConnectionFromEnv`
- [`packages/helpers-currency`](/Users/mitcheldowney/repos/pv/metaboost/packages/helpers-currency) — `normalizeCurrencyCode`, `roundHalfUp` / minor-major helpers

Skip packages that are thin wrappers around external APIs with no stable unit surface.

## Verification

- `./scripts/nix/with-env npm run test -w @metaboost/helpers-valkey`
- `./scripts/nix/with-env npm run test -w @metaboost/helpers-currency`
