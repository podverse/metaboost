# GitHub Repository Setup

One-time configuration steps for this repository. Aligns with the workflows and conventions in [GITFLOW.md](../GITFLOW.md), [BRANCH-PROTECTION.md](BRANCH-PROTECTION.md), and [GITHUB-LABELS.md](GITHUB-LABELS.md).

## 1. Issue Templates

When opening a new issue, GitHub shows templates from `.github/ISSUE_TEMPLATE/` so contributors can choose Bug Report, Feature Request, Technical Improvement, Documentation, Infrastructure, or Question. Each template applies the matching label (`bug`, `enhancement`, `technical-improvement`, `docs`, `infra`, `question`). No setup required; templates are used automatically. To add or edit templates, see [GitHub’s issue template docs](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository).

## 2. Labels

Create or update all repository labels:

```bash
gh auth login   # once, if not already authenticated
./scripts/github/setup-all-labels.sh
```

The script is idempotent. If the repo has labels not defined in the script, it will list them and optionally delete them (deleting does not remove labels from existing issues/PRs). See [GITHUB-LABELS.md](GITHUB-LABELS.md) for the full label reference and [scripts/github/SCRIPTS-GITHUB.md](../../scripts/github/SCRIPTS-GITHUB.md) for details.

## 3. Default Branch

Set the default branch to **develop** so PRs and CI behave as documented:

- GitHub repo → Settings → General → Default branch → Switch to `develop` (create the branch first if needed)

## 4. Branch Protection

Configure branch protection for `develop` so that:

- Changes land via pull request (no direct push)
- Required status check: `validate` (from `.github/workflows/ci.yml`)
- No force pushes

See [BRANCH-PROTECTION.md](BRANCH-PROTECTION.md) for the full table and settings.

**Steps:** Settings → Branches → Add rule (or Edit) → Branch name pattern `develop` → Enable "Require a pull request before merging", "Require status checks to pass" (add `validate`), "Do not allow force pushes".

## 5. Optional: GitHub App

If you use a GitHub App for CI status checks, deployment, or other automation:

- Create the App in the organization (or user) settings
- Install it on this repository
- Store App ID and private key (or installation token) in secrets as required by your workflows

This is optional; the repository works with the default GitHub Actions permissions without an App.

## 6. Dependency updates (Dependabot)

Dependabot is configured in [`.github/dependabot.yml`](../../.github/dependabot.yml) and opens
PRs for npm, Docker, and GitHub Actions updates. Schedule, grouping, and Node LTS policy
(≥ 24 only) are described in [DEPENDABOT.md](DEPENDABOT.md). Ensure labels `dependencies`
and `docker` exist (section 2) so Dependabot can apply them.
