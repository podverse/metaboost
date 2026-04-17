# metaboost-signing-helpers — distribution and releases

This document describes how the **`metaboost-signing-helpers`** npm package is published, versioned, and consumed. Implementation lives under [`packages/metaboost-signing-helpers/`](../../packages/metaboost-signing-helpers/).

## Install

From any backend project with access to the **public npm registry** (no GitHub authentication required):

```bash
npm install metaboost-signing-helpers
```

The package is published to **`https://registry.npmjs.org`**. Use a normal semver range in `package.json` (for example `^0.1.8`).

The library is released under the **MIT** license (see `LICENSE` in [`packages/metaboost-signing-helpers/`](../../packages/metaboost-signing-helpers/LICENSE)), distinct from the AGPL-licensed Metaboost monorepo as a whole.

## Runtime requirements

- **Node.js** `>= 24.0.0` (aligned with the Metaboost monorepo `engines` policy).
- **Backend-only:** signing keys must stay on trusted servers; see the package README and [S-ENDPOINT-APP-SIGNING.md](./S-ENDPOINT-APP-SIGNING.md).

## v1 API stability (semver)

For **`metaboost-signing-helpers`**, semver applies to the **documented public exports** from the package entry point:

- `hashRequestBody`
- `createAssertionClaims`
- `signAppAssertion`
- `buildSignedRequestHeaders`
- `APP_ASSERTION_MAX_TTL_SECONDS`
- Types exported for the above where applicable

**Patch** releases: bug fixes and internal changes that do not alter the intended behavior of those exports.

**Minor** releases: backward-compatible additions (new optional parameters, new exports).

**Major** releases: breaking changes to any of the above (removed exports, changed required parameters, changed claim or header semantics). Consumers should read `CHANGELOG.md` in the package and plan upgrades.

## Deprecation and breaking changes

- Breaking changes ship only in **major** versions, with entries in **`packages/metaboost-signing-helpers/CHANGELOG.md`**.
- Deprecated APIs (if any) will be documented in the changelog and may be removed in the next major version after a reasonable deprecation window when practical.

## Release process (maintainers)

Semantic versioning:

1. Update **`packages/metaboost-signing-helpers/package.json`** `version` (semver).
2. Update **`packages/metaboost-signing-helpers/CHANGELOG.md`** with a dated section for that version.
3. Commit and push to the default branch.
4. Create an annotated git tag **`metaboost-signing-helpers-vX.Y.Z`** pointing at the commit that contains the version bump (tag must match the package version).
5. Push the tag; the **Publish metaboost-signing-helpers** GitHub Actions workflow runs `npm publish` for that workspace.

**Required secret:** `NPM_TOKEN` — an npm automation token with permission to publish this package (repository **Settings → Secrets and variables → Actions**).

Manual runs: the workflow also supports **`workflow_dispatch`** with an optional **dry run** (`npm publish --dry-run`).

## Rollback for consumers

If a release is bad, **pin** the last known good version in `package.json` and reinstall:

```bash
npm install metaboost-signing-helpers@<previous-version>
```

Commit the updated lockfile. This is the primary consumer rollback path.

## Rollback for publishers (npm)

npm allows **`npm unpublish`** only under [strict conditions](https://docs.npmjs.com/policies/unpublish) (time window, download counts, etc.). Prefer **shipping a forward fix** (e.g. `X.Y.Z+1`) when unpublish is not available. Document incidents in the changelog when a version must not be used.
