# 10 - NPM Publish Verification Gate (metaboost-signing)

> **Status:** **Completed.** Completion recorded in [COPY-PASTA.md](./COPY-PASTA.md) Phase 5 (minimum semver **0.2.1**).

## Scope

Record a **binary verification** that **`metaboost-signing`** is installable from the **public**
npm registry at a known version **before** any downstream monorepo (e.g. Podverse) adds a dependency on
that package.

[04-signing-helpers-package-release-and-distribution.md](04-signing-helpers-package-release-and-distribution.md)
defines the publish workflow; this gate proves the artifact exists for consumers.

## Preconditions

- Phase 2 step **04** is complete (workflow, `publishConfig`, tag convention `metaboost-signing-v*`).
- A maintainer has run the release process and the package appears on **https://www.npmjs.com/package/metaboost-signing** (or will do so before downstream work).
- **`NPM_TOKEN`** used for CI (or local publish) can **publish** the unscoped name **`metaboost-signing`**.

## Steps

1. From a clean machine or empty temp directory (no monorepo `file:` link), verify the package resolves:

   ```bash
   npm view metaboost-signing version
   npm view metaboost-signing dist-tags
   ```

2. Confirm the **latest** (or chosen) version matches a **git tag** per
   [METABOOST-SIGNING-DISTRIBUTION.md](../../../../docs/api/METABOOST-SIGNING-DISTRIBUTION.md)
   (`metaboost-signing-vX.Y.Z` on the Metaboost default branch).

3. Optional smoke install:

   ```bash
   mkdir -p /tmp/ms-verify && cd /tmp/ms-verify && npm init -y && npm install metaboost-signing@<pinned-version>
   node --input-type=module -e "import('metaboost-signing').then(() => console.log('ok'))"
   ```

4. Record in **COPY-PASTA** completion text (and this session’s notes):
   - **Pinned semver** downstream repos must use (minimum `X.Y.Z`).
   - **Date verified** and **tag URL** or **npm version page** reference.

## Exit criteria

- [x] `npm view metaboost-signing version` returns a published semver.
- [x] Minimum version for Podverse (and other consumers) is **written down** in COPY-PASTA Phase 5 completion line.
- [x] No downstream `package.json` work that imports `metaboost-signing` starts **before** this gate is checked.

## Verification

- Gate completion line is paste-ready for [COPY-PASTA.md](./COPY-PASTA.md).
- Plan **12** (Podverse integration) may proceed once COPY-PASTA records the minimum published semver (satisfied).

## Implementation Notes

- If the package is **not** yet on npm, complete the publish from Metaboost first; this gate **fails closed** until `npm view` succeeds.
