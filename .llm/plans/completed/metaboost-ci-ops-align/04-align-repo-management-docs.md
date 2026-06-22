# 04 — Align repo-management and release docs

## Scope

Update MetaBoost repo-management and release docs to match current workflows (no changelog/export
pipelines).

## Files

- `docs/repo-management/BRANCH-PROTECTION.md`
- `docs/repo-management/DEPENDABOT.md`
- `docs/repo-management/GITHUB-LABELS.md`
- `docs/repo-management/GITHUB-SETUP.md`
- `scripts/github/setup-all-labels.sh`, `scripts/github/SCRIPTS-GITHUB.md`
- `docs/PUBLISH.md`, `docs/GITFLOW.md`
- `docs/development/release/STAGING-MAIN-PROMOTION.md`
- `docs/development/release/METABOOST-PUBLISH-GITOPS-BUMP-CHECKLIST.md`

## Steps

1. Remove stale references to deleted changelog or llm-export workflows.
2. Document new/ adopted workflows (`vulnerability-scanner`, `complete-feature` if adopted).
3. Cross-link `github-actions-yaml` rule once added via `metaboost-abcmemory-align`.

## Verification

```bash
rg -n "llm-exports|CHANGELOG-UPCOMING|release-changelog" docs/repo-management docs/PUBLISH.md docs/GITFLOW.md || echo clean
```
