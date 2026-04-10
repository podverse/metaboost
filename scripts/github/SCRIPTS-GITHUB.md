# GitHub scripts

## Labels

Create or update all repository labels (idempotent):

```bash
gh auth login   # once, if not already authenticated
./scripts/github/setup-all-labels.sh
```

Labels include: GitHub defaults (bug, enhancement, etc.), area labels (apps, packages, docs, infra, ci, scripts, tools, i18n), workflow labels (blocked, security, dependencies, docker), and priority (priority:critical through priority:low). Running the script again updates color/description if they change; no duplicate labels are created.

If the repo has labels not defined in the script, the script lists them and asks whether to delete them. Deleting does not remove labels from existing issues or PRs (those keep the label); it only removes the label from the list available for new issues and PRs.

Full label reference (name, color, description, usage): [docs/repo-management/GITHUB-LABELS.md](../../docs/repo-management/GITHUB-LABELS.md).

## PR labeler

If `.github/workflows/pr-labeler.yml` is present, opened/updated PRs are automatically labeled from changed paths (e.g. `apps/*` → apps, `packages/*` → packages, `scripts/*` → scripts, `tools/*` → tools; paths containing `/i18n/` get i18n). Ensure labels exist first by running `setup-all-labels.sh`.
