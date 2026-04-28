# Gitflow and CI

## Branch model

- **Default branch:** `develop`. All PRs merge into `develop`; release or hotfix branches may target `main` when used.
- **Feature branches:** Create from `develop` with `npm run start-feature` (or `./scripts/start-feature.sh`). The script creates branches named e.g. `feature/name`, `fix/name`, `chore/name`, `docs/name`, `hotfix/name`, or `release/name`.
- **Staging and main (mirrors, no direct feature commits on those branches):** `staging` is the preprod line—fast-forward it from `develop`, then run **Publish (staging)**. When you are ready for production, fast-forward `main` from `staging` (not from `develop` in one hop); **Publish (main)** promotes existing staging images in GHCR to `X.Y.Z` / `:latest` without rebuilding. See [PUBLISH.md](PUBLISH.md).

## When CI runs

CI does **not** run on push to `develop` or `main`, and it does **not** run automatically when a PR is opened or updated. It runs **only** when an OWNER, MEMBER, or COLLABORATOR comments **/test** on a pull request. A reaction (e.g. rocket) is added to the comment; on success or failure a PR comment and commit status are posted.

**Comment-Triggered CI:** This keeps Actions usage and branch-protection checks under maintainer control and avoids CI runs from untrusted or high-volume PRs.

## Validate job

The job runs: checkout, Node 24, `npm ci`, `npm run build`, `npm run lint`, `npm run type-check`. No database migration step is run unless one is added later.

## Repository setup

For one-time GitHub configuration (labels, branch protection, default branch), see [repo-management/GITHUB-SETUP.md](repo-management/GITHUB-SETUP.md). See also [repo-management/BRANCH-PROTECTION.md](repo-management/BRANCH-PROTECTION.md) and [repo-management/GITHUB-LABELS.md](repo-management/GITHUB-LABELS.md).

### Important: workflow vs required checks

`.github/workflows/ci.yml` defines **how** `validate` runs (`/test` comment trigger).
Whether `validate` is **required for merge** is controlled by GitHub protection
settings (prefer Rulesets), not by workflow YAML alone.

### Vendor-specific caveat

These protection/configuration instructions are GitHub-specific. Forks hosted on
GitLab, Gitea, Bitbucket, or other providers must configure equivalent protected
branch + required-check policies using that platform's native features.
