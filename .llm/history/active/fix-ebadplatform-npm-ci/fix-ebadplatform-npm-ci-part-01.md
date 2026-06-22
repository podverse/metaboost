# fix-ebadplatform-npm-ci

**Started:** 2026-05-06  
**Author:** Cursor Agent  
**Context:** Remove `--include=optional` from CI/publish install steps to avoid `EBADPLATFORM` on platform-scoped optional dependencies while keeping Linux lockfile generation unchanged.

### Session 1 - 2026-05-06

#### Prompt (Developer)

fix it for both podverse and metaboost

#### Key Decisions

- Keep Linux lockfile-generation scripts (`update-lockfile-linux.sh`) on `npm install --include=optional`.
- Change CI/publish install steps from `npm ci --include=optional` to plain `npm ci`.
- Limit scope to workflow install steps; do not change lockfile docs/scripts in this pass.

#### Files Created/Modified

- `.github/workflows/ci.yml`
- `.github/workflows/publish-staging.yml`
- `.github/workflows/publish-metaboost-signing.yml`
- `.llm/history/active/fix-ebadplatform-npm-ci/fix-ebadplatform-npm-ci-part-01.md`

### Session 2 - 2026-05-06

#### Prompt (Developer)

implement

#### Key Decisions

- Pin npm in GitHub Actions workflows to `11.13.0` after `actions/setup-node@v6`.
- Apply npm pin to every Metaboost workflow that runs `npm ci`.
- Keep lockfile-generation scripts unchanged.

#### Files Created/Modified

- `.github/workflows/ci.yml`
- `.github/workflows/publish-staging.yml`
- `.github/workflows/publish-metaboost-signing.yml`
- `.github/workflows/i18n.yml`
- `.llm/history/active/fix-ebadplatform-npm-ci/fix-ebadplatform-npm-ci-part-01.md`
