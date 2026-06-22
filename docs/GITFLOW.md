# Gitflow and CI

## Branch model

- **Default branch:** `develop`. All PRs merge into `develop`; release or hotfix branches may target `main` when used.
- **Feature branches:** Create from `develop` with `npm run start-feature` (or `./scripts/start-feature.sh`). The script creates branches named e.g. `feature/name`, `fix/name`, `chore/name`, `docs/name`, `hotfix/name`, `release/name`, or `llm/name` (LLM-only paths; see [docs/development/llm/DOCS-DEVELOPMENT-LLM.md](development/llm/DOCS-DEVELOPMENT-LLM.md)).
- **Staging and main (mirrors, no direct feature commits on those branches):** `staging` is the preprod line—fast-forward it from `develop`, then run **Publish (staging)**. When you are ready for production, fast-forward `main` from `staging` (not from `develop` in one hop); **Publish (main)** promotes existing staging images in GHCR to `X.Y.Z` / `:latest` without rebuilding. See [PUBLISH.md](PUBLISH.md).

## When CI runs

CI does **not** run on push to `develop` or `main`, and it does **not** run automatically when a PR is opened or updated. It runs **only** when an OWNER, MEMBER, or COLLABORATOR comments **/test** on a pull request. A reaction (e.g. rocket) is added to the comment; on success or failure a PR comment and commit status are posted.

**Comment-Triggered CI:** This keeps Actions usage and branch-protection checks under maintainer control and avoids CI runs from untrusted or high-volume PRs.

## Validate job

The `validate` job in [`.github/workflows/ci.yml`](/.github/workflows/ci.yml) runs when a maintainer comments **`/test`** on a PR. It includes:

1. Linear migration file validation and linear baseline 0003 verification
2. DB init sync check (`make check_k8s_postgres_init_sync`) and bootstrap contract verification
3. Runtime `CREATE EXTENSION` guard
4. `npm ci` (with retry), `npm run build:packages`, `npm run lint`, `npm run build:apps`
5. `npm run i18n:validate` and `npm run type-check`
6. Test database setup (Postgres/Valkey service containers on ports **5632** / **6579**)

Unit and E2E tests are **skipped in CI**; run locally before merge (see [AGENTS.md](/AGENTS.md)).

## Other GitHub Actions workflows

| Workflow                                                                                      | Trigger                        | Purpose                                                                                  |
| --------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| [complete-feature.yml](/.github/workflows/complete-feature.yml)                               | PR merged to `develop`         | Moves `.llm/history/active/<feature>/` to `.llm/history/completed/YYYY-MM/` when present |
| [vulnerability-scanner.yml](/.github/workflows/vulnerability-scanner.yml)                     | Schedule (2× daily) + manual   | `npm audit --omit=dev`; may open security issues                                         |
| [i18n.yml](/.github/workflows/i18n.yml)                                                       | Push to `develop` (i18n paths) | Sync and compile translations                                                            |
| [publish-staging.yml](/.github/workflows/publish-staging.yml)                                 | Push to `staging`              | Build and push staging images                                                            |
| [publish-main.yml](/.github/workflows/publish-main.yml)                                       | Push to `main`                 | Promote staging images to RTM tags                                                       |
| [publish-metaboost-signing.yml](/.github/workflows/publish-metaboost-signing.yml)             | Tag / manual                   | Publish `metaboost-signing` to npm                                                       |
| [metaboost-infra-alpha-contracts.yml](/.github/workflows/metaboost-infra-alpha-contracts.yml) | Manual / schedule              | GitOps pin contract checks                                                               |

Workflow authoring: [.cursor/rules/github-actions-yaml.mdc](/.cursor/rules/github-actions-yaml.mdc).

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
