# @podverse/metaboost-signing — distribution and releases

This document describes how the **`@podverse/metaboost-signing`** npm package is published, versioned, and consumed. Implementation lives under [`packages/metaboost-signing/`](../../packages/metaboost-signing/).

## Install

From any backend project with access to the **public npm registry** (no GitHub authentication required):

```bash
npm install @podverse/metaboost-signing
```

The package is published to **`https://registry.npmjs.org`** under the **[@podverse](https://www.npmjs.com/org/podverse)** organization. Use a normal semver range in `package.json` (for example `^0.2.0`).

The library is released under the **MIT** license (see `LICENSE` in [`packages/metaboost-signing/`](../../packages/metaboost-signing/LICENSE)), distinct from the AGPL-licensed Metaboost monorepo as a whole.

## Podverse org on npm (maintainers)

Publishing **requires**:

1. **Organization:** The **`podverse`** org exists on [npmjs.com](https://www.npmjs.com/org/podverse). If it does not, an npm account that is allowed to create orgs should create it ([create an organization](https://docs.npmjs.com/creating-an-organization)).
2. **Membership:** Your npm user (or the user that owns the CI token) is added to the **podverse** org with a role that can **publish packages** (e.g. developer or owner).
3. **Token:** Use an **Automation** or **Granular Access Token** that includes **publish** rights for **`@podverse/*`** (or the whole org). Personal tokens tied to a user who is not in the org will get **404 on `PUT`** when publishing, which npm intentionally returns instead of a clearer “forbidden” in some cases.
4. **First publish of a scoped public package:** Always `npm publish --access public` (the GitHub Actions workflow already passes `--access public`).

**GitHub Actions:** Store that token as **`NPM_TOKEN`** in the Metaboost repo **Settings → Secrets and variables → Actions**. The **Publish metaboost-signing** workflow uses **`NODE_AUTH_TOKEN`**, which npm reads for `npm publish`.

**Local publish (manual):** From the monorepo root after `npm ci` and a successful build:

```bash
npm run build -w @podverse/metaboost-signing
npm publish -w @podverse/metaboost-signing --access public
```

Verify after release:

```bash
npm view @podverse/metaboost-signing version
```

## Runtime requirements

- **Node.js** `>= 24.0.0` (aligned with the Metaboost monorepo `engines` policy).
- **Backend-only:** signing keys must stay on trusted servers; see the package README and [STANDARD-ENDPOINT-APP-SIGNING.md](./STANDARD-ENDPOINT-APP-SIGNING.md).

## v1 API stability (semver)

For **`@podverse/metaboost-signing`**, semver applies to the **documented public exports** from the package entry point:

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

**Required secret:** `NPM_TOKEN` — an npm token with permission to publish **`@podverse/metaboost-signing`** (repository **Settings → Secrets and variables → Actions**).

Manual runs: the workflow also supports **`workflow_dispatch`** with an optional **dry run** (`npm publish --dry-run`).

## Rollback for consumers

If a release is bad, **pin** the last known good version in `package.json` and reinstall:

```bash
npm install @podverse/metaboost-signing@<previous-version>
```

Commit the updated lockfile. This is the primary consumer rollback path.

## Rollback for publishers (npm)

npm allows **`npm unpublish`** only under [strict conditions](https://docs.npmjs.com/policies/unpublish) (time window, download counts, etc.). Prefer **shipping a forward fix** (e.g. `X.Y.Z+1`) when unpublish is not available. Document incidents in the changelog when a version must not be used.
