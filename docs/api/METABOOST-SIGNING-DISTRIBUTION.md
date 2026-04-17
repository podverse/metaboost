# metaboost-signing — distribution and releases

This document describes how the **`metaboost-signing`** npm package is published, versioned, and consumed. Implementation lives under [`packages/metaboost-signing/`](../../packages/metaboost-signing/).

## Install

From any backend project with access to the **public npm registry** (no GitHub authentication required):

```bash
npm install metaboost-signing
```

The package is published to **`https://registry.npmjs.org`**. Use a normal semver range in `package.json` (for example `^0.2.1`).

The library is released under the **MIT** license (see `LICENSE` in [`packages/metaboost-signing/`](../../packages/metaboost-signing/LICENSE)), distinct from the AGPL-licensed Metaboost monorepo as a whole.

## Publishing (maintainers)

**Unscoped** package: the npm user (or automation token owner) must have permission to **publish** the name **`metaboost-signing`**. Use an **Automation** or **Granular Access Token** with **publish** for that package (or an account that is allowed to create new public packages, per npm policy).

If **`npm publish`** returns **404 on `PUT`**, the usual causes are a token without publish rights, 2FA requirements, or npm treating the error opaquely — verify the token and account on [npmjs.com](https://www.npmjs.com/).

**First publish:** `npm publish --access public` is only required for **scoped** packages; unscoped public packages use the default. This repo’s workflow passes `--access public` for consistency and does not change unscoped behavior.

**GitHub Actions:** Store the token as **`NPM_TOKEN`** in the Metaboost repo **Settings → Secrets and variables → Actions**. The **Publish metaboost-signing** workflow sets **`NODE_AUTH_TOKEN`**.

**Local publish (manual):** From the monorepo root after `npm ci` and a successful build:

```bash
npm run build -w metaboost-signing
npm publish -w metaboost-signing --access public
```

Verify after release:

```bash
npm view metaboost-signing version
```

## Runtime requirements

- **Node.js** `>= 24.0.0` (aligned with the Metaboost monorepo `engines` policy).
- **Backend-only:** signing keys must stay on trusted servers; see the package README and [STANDARD-ENDPOINT-APP-SIGNING.md](./STANDARD-ENDPOINT-APP-SIGNING.md).

## v1 API stability (semver)

For **`metaboost-signing`**, semver applies to the **documented public exports** from the package entry point:

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

- Breaking changes ship only in **major** versions, with entries in **`packages/metaboost-signing/CHANGELOG.md`**.
- Deprecated APIs (if any) will be documented in the changelog and may be removed in the next major version after a reasonable deprecation window when practical.

## Release process (maintainers)

Semantic versioning:

1. Update **`packages/metaboost-signing/package.json`** `version` (semver).
2. Update **`packages/metaboost-signing/CHANGELOG.md`** with a dated section for that version.
3. Commit and push to the default branch.
4. Create an annotated git tag **`metaboost-signing-vX.Y.Z`** pointing at the commit that contains the version bump (tag must match the package version).
5. Push the tag; the **Publish metaboost-signing** GitHub Actions workflow runs `npm publish` for that workspace.

**Required secret:** `NPM_TOKEN` — an npm token with permission to publish **`metaboost-signing`** (repository **Settings → Secrets and variables → Actions**).

Manual runs: the workflow also supports **`workflow_dispatch`** with an optional **dry run** (`npm publish --dry-run`).

## Rollback for consumers

If a release is bad, **pin** the last known good version in `package.json` and reinstall:

```bash
npm install metaboost-signing@<previous-version>
```

Commit the updated lockfile. This is the primary consumer rollback path.

## Rollback for publishers (npm)

npm allows **`npm unpublish`** only under [strict conditions](https://docs.npmjs.com/policies/unpublish) (time window, download counts, etc.). Prefer **shipping a forward fix** (e.g. `X.Y.Z+1`) when unpublish is not available. Document incidents in the changelog when a version must not be used.
