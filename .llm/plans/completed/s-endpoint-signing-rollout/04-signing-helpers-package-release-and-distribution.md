# 04 - Signing Helpers Package Release And Distribution

## Scope

Define how the signing helpers package is versioned, published, and consumed by third-party backend APIs.

**Published package name (target):** `metaboost-signing-helpers` (unscoped public npm). In this monorepo the code lives under `packages/metaboost-signing-helpers/`.

## Outcomes

- Package distribution path is clear and repeatable.
- Release/versioning policy supports safe adoption.
- Integrators have concise install and upgrade guidance.

## Steps

1. Define package metadata and publishing target:
   - public npm registry (`https://registry.npmjs.org`) for third-party adoption.
2. Define CI release workflow:
   - semantic versioning policy;
   - changelog/release notes;
   - publish automation and rollback process.
3. Add distribution docs:
   - install instructions;
   - runtime requirements;
   - minimal usage snippet.
4. Define compatibility contract:
   - Node runtime support;
   - API stability guarantees for v1.
5. Add deprecation and breaking-change policy for future major versions.

## Distribution Contract

- Consumers install a versioned package.
- Integrators keep private key management in their own infrastructure.
- Package never requires a hosted Metaboost-managed signing service.
- Default install path is npm (`npm install <package-name>`), with no GitHub auth/token requirement for consumers.

## Key Files

- [`/Users/mitcheldowney/repos/pv/metaboost/packages/`](file:///Users/mitcheldowney/repos/pv/metaboost/packages/)
- [`/Users/mitcheldowney/repos/pv/metaboost/.github/workflows/`](file:///Users/mitcheldowney/repos/pv/metaboost/.github/workflows/)
- [`/Users/mitcheldowney/repos/pv/metaboost/docs/api/`](file:///Users/mitcheldowney/repos/pv/metaboost/docs/api/)

## Verification

- Package can be installed and used in a sample backend app without framework-specific glue.
- Release workflow publishes and tags package versions successfully.
- Upgrade guide includes rollback instructions for consumers.
