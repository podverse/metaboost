# Branch Protection and Required Checks

This document describes how merge protection is enforced for Metaboost.

## GitHub Configuration Model

Use **GitHub Rulesets** as the primary protection mechanism. Rulesets are configured at:

- GitHub Repository -> Settings -> Rules -> Rulesets

Current target policy uses a shared ruleset approach. The **GitHub** ruleset `develop-protection` includes
**`refs/heads/develop`**, **`refs/heads/main`**, and **`refs/heads/staging`** (the preprod / publish-train
trigger; the legacy `alpha` Git ref was removed from this list in favor of `staging`).

- Ruleset name: `develop-protection`
- Required status check: `validate`
- PR guardrails (same for all three branches in the ruleset):
  - require pull request before merge
  - 1 approving review
  - dismiss stale approvals on push
  - require code owner review
  - require review thread resolution
- Additional branch controls:
  - block branch deletion
  - block non-fast-forward pushes
- Bypass handling:
  - Team `admins` can bypass ruleset checks/review requirements (`always`)
  - Team `reviewers` can bypass ruleset checks/review requirements (`always`)

## Avoid overlapping enforcement

Use Rulesets as the only merge-governance source of truth. Do not duplicate the
same policy under Settings -> Branches, because overlapping controls create
confusing merge behavior and configuration drift.

## Required Status Check: `validate`

The required check `validate` is posted by `.github/workflows/ci.yml` as a commit
status context. CI is comment-gated and runs only when an OWNER, MEMBER, or
COLLABORATOR comments `/test` on a PR.

Expected PR behavior:

1. PR opens/updates: `validate` is required and pending/expected.
2. Maintainer comments `/test`.
3. CI runs and posts `validate` success/failure.
4. Merge remains blocked until required checks and review policy are satisfied.

Note: users in configured bypass teams can merge without being blocked by the
approval requirement step, per the ruleset bypass policy above.

## Local Enforcement

In addition to GitHub-hosted enforcement, local hooks can block risky pushes:

- pre-push: block direct pushes to protected branches
- pre-push: validate branch naming conventions

See `scripts/git-hooks/` for implementation details.

## Vendor-Specific Note

This document is **GitHub-specific** (Rulesets, Branch protection, required
status checks, and `/test` comment-triggered workflow behavior).

If you fork this project to another git hosting platform (GitLab, Gitea,
Bitbucket, etc.), configure equivalent controls using that platform's native
protected-branch and required-pipeline/check features.
