---
name: github
description: gh CLI and GitHub issue/PR workflow for agents. Use when referencing PRs, issues, or Dependabot updates.
version: 1.0.0
---

# GitHub Workflows & Issue Management

## Agent policy: `gh` is a git operation

For agents, **`gh` counts as git** — same operator-only policy as `git`. Read-only `gh` is fine
(`gh pr view`, `gh issue list`, `gh run list`). Do **not** run write `gh` commands
(`gh pr create`, `gh pr merge`, `gh release create`, mutating `gh api`, etc.) unless the user
explicitly requests that exact command in that message.

After implementation, give the operator fenced `bash` commands (`git` and `gh`) for commit, push,
PR, and merge. See **operator-only-git-operations** rule.

## Repository information

- **Repository**: `podverse/metaboost`
- **Full URL**: https://github.com/podverse/metaboost
- **Issues**: https://github.com/podverse/metaboost/issues
- **Pull Requests**: https://github.com/podverse/metaboost/pulls

## Accessing PRs and issues

### Using GitHub CLI (when available)

```bash
gh pr view 35
gh pr list
gh issue view 42
gh issue list
```

The `gh` CLI requires network permissions. If certificate errors occur, the command may need full
permissions in sandboxed environments.

### Direct URLs

- **PR**: `https://github.com/podverse/metaboost/pull/{number}`
- **Issue**: `https://github.com/podverse/metaboost/issues/{number}`

## Common Dependabot PR patterns

### PR title format

```
chore(deps): bump {package} from {old-version} to {new-version}
```

### Labels

See [docs/repo-management/GITHUB-LABELS.md](/docs/repo-management/GITHUB-LABELS.md).

### Finding affected files

```bash
grep -r "@types/node" --include="package.json"
```

## Workflow for dependency updates

1. Identify affected workspaces
2. Update versions consistently
3. On macOS after lockfile Linux refresh: `./scripts/development/update-lockfile-linux.sh`, then
   host `npm install` (see **native-deps-platform-mismatch**)
4. Operator runs `npm run lint` and targeted tests

## Git history for PRs

```bash
git log --all --oneline --grep="#35"
git log --all --oneline --grep="chore(deps)"
git branch -vv
```

## Related documentation

- [GITHUB-LABELS.md](/docs/repo-management/GITHUB-LABELS.md)
- [CONTRIBUTING.md](/docs/development/CONTRIBUTING.md) — when present
- [global](/.cursor/skills/global/SKILL.md) — repo-wide patterns
