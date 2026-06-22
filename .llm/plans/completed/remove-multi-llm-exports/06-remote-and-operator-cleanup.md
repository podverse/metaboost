# Plan 06 — Remote and operator cleanup

## Objective

Clean up GitHub state after removal PRs merge to `develop`.

## Scope

**Both** Podverse and Metaboost GitHub repositories. Identical to Podverse plan 06.

## Steps (per repo)

1. Close open PRs from branches `llm` and `llm-full` into `develop`
2. Delete remote branches `llm` and `llm-full`
3. Optionally delete GitHub label `llm`
4. Confirm export workflow Actions no longer appear

```bash
gh pr list --head llm --state open
gh pr list --head llm-full --state open
git push origin --delete llm llm-full
```

Run for **Podverse** and **Metaboost** remotes.

## Prerequisites

- Metaboost and Podverse plans 01–04 merged to `develop`
- Export workflow YAML removed from `develop`

## Acceptance checklist

- [ ] No open `llm` / `llm-full` PRs (both repos)
- [ ] Remote branches deleted (both repos)

See also: `podverse/.llm/plans/active/remove-multi-llm-exports/06-remote-and-operator-cleanup.md`
