# Changelog

All notable changes to **@podverse/metaboost-signing** are documented here. This project follows [Semantic Versioning](https://semver.org/) for the **public API** exported from the package entry point (`@podverse/metaboost-signing`).

## [0.2.0] - 2026-04-17

### Changed

- **npm package name** is now **`@podverse/metaboost-signing`** (published under the [Podverse npm organization](https://www.npmjs.com/org/podverse)). Install with `npm install @podverse/metaboost-signing` and import from `'@podverse/metaboost-signing'`. Unscoped `metaboost-signing` was never successfully published.

## [0.1.9] - 2026-04-17

### Changed

- npm package name **`metaboost-signing-helpers` → `metaboost-signing`** (shorter). Monorepo path **`packages/metaboost-signing`**. Git release tags **`metaboost-signing-vX.Y.Z`**. Error message prefix **`metaboost-signing:`**.

## [0.1.8] - 2026-04-16

### Added

- Initial public distribution metadata, release workflow, and consumer-facing distribution documentation.
- v1 exports: `hashRequestBody`, `createAssertionClaims`, `signAppAssertion`, `buildSignedRequestHeaders`, `APP_ASSERTION_MAX_TTL_SECONDS`.

### Changed

- Package license is **MIT** (see `LICENSE` in the package root on npm).
