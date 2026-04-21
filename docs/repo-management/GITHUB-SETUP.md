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

## 4. Branch Protection / Rulesets

Use **Rulesets** as the enforcement layer (GitHub Settings -> Rules -> Rulesets).

Baseline target:

- Active ruleset `develop-protection`
- Refs: `develop` (and optionally `main`, `alpha` for release flows)
- Required status check: `validate` (from `.github/workflows/ci.yml`)
- PR review requirements and anti-force-push controls per
  [BRANCH-PROTECTION.md](BRANCH-PROTECTION.md)
- Bypass actors: teams `admins` and `reviewers` in `always` mode (for maintainer
  emergency/operations merge paths)

Ensure there is no overlapping rule under Settings -> Branches for the same ref
set; keep a single enforcement source to avoid double-gating drift.

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

## Vendor-Specific Note

This setup guide is GitHub-specific. If your fork is hosted on another platform,
map these controls to that provider's equivalents (protected branches, required
checks/pipelines, and reviewer requirements).
