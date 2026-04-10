# Branch Protection Rules

This document describes the branch protection rules that should be configured in GitHub.

## Configuration Location

GitHub Repository > Settings > Branches > Add branch protection rule

## Branch: `develop`

**Pattern**: `develop`

| Setting                               | Value      |
| ------------------------------------- | ---------- |
| Require a pull request before merging | Yes        |
| Required approving reviews            | 1          |
| Dismiss stale pull request approvals  | Yes        |
| Require status checks to pass         | Yes        |
| Required status checks                | `validate` |
| Require branches to be up to date     | Yes        |
| Allow force pushes                    | No         |
| Allow deletions                       | No         |

## Branch: `alpha`

**Pattern**: `alpha`

Use when the project adopts release branches. PRs target alpha for pre-release testing.

| Setting                               | Value                   |
| ------------------------------------- | ----------------------- |
| Require a pull request before merging | Yes                     |
| Required approving reviews            | 1                       |
| Dismiss stale pull request approvals  | Yes                     |
| Require status checks to pass         | Yes                     |
| Required status checks                | `validate`              |
| Require branches to be up to date     | Yes                     |
| Restrict who can push                 | Maintainers team or org |
| Allow force pushes                    | No                      |
| Allow deletions                       | No                      |

## Branch: `beta`

**Pattern**: `beta`

Use when the project adopts release branches. PRs target beta for release-candidate testing.

| Setting                               | Value                   |
| ------------------------------------- | ----------------------- |
| Require a pull request before merging | Yes                     |
| Required approving reviews            | 1                       |
| Dismiss stale pull request approvals  | Yes                     |
| Require review from Code Owners       | Yes                     |
| Require status checks to pass         | Yes                     |
| Required status checks                | `validate`              |
| Require branches to be up to date     | Yes                     |
| Restrict who can push                 | Maintainers team or org |
| Require linear history                | Yes                     |
| Allow force pushes                    | No                      |
| Allow deletions                       | No                      |

## Branch: `main`

**Pattern**: `main`

Use when the project adopts a production branch. PRs target main from beta (or develop) for release.

| Setting                               | Value                   |
| ------------------------------------- | ----------------------- |
| Require a pull request before merging | Yes                     |
| Required approving reviews            | 1                       |
| Dismiss stale pull request approvals  | Yes                     |
| Require review from Code Owners       | Yes                     |
| Require status checks to pass         | Yes                     |
| Required status checks                | `validate`              |
| Require branches to be up to date     | Yes                     |
| Restrict who can push                 | Maintainers team or org |
| Require linear history                | Yes                     |
| Allow force pushes                    | No                      |
| Allow deletions                       | No                      |

## Local Enforcement

In addition to GitHub branch protection, local git hooks enforce:

- **pre-push**: Blocks direct pushes to protected branch (develop; and main, beta, alpha when used)
- **pre-push**: Validates branch naming conventions (feature/_, fix/_, chore/_, docs/_, hotfix/_, release/_)

Commit message template (`.gitmessage`) suggests optional GitHub issue references (#123). See `scripts/git-hooks/` for implementation details.

## Required Status Checks

The `validate` job is defined in `.github/workflows/ci.yml` and runs:

1. Install dependencies (`npm ci`)
2. Build (`npm run build`)
3. Lint (`npm run lint`)
4. Type-check (`npm run type-check`)

All checks must pass before a PR can be merged (when branch protection requires the `validate` status).

## Comment-Triggered CI

CI runs only when an OWNER, MEMBER, or COLLABORATOR comments **/test** on a pull request. It does not run automatically on PR open or update.

**Workflow:**

1. Contributor opens PR targeting develop
2. Maintainer reviews code for obvious issues or malicious content
3. Maintainer comments `/test` on the PR to trigger CI
4. CI runs and posts results as a comment and commit status
5. If CI passes, maintainer can approve the PR

**Who can trigger CI:**

- Repository owners
- Organization members
- Collaborators with write access

The workflow adds a reaction to the `/test` comment to confirm CI has started.
