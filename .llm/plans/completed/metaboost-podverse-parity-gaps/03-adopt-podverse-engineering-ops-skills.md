# 03 — Adopt Podverse engineering ops skills

## Scope

Contributor/process skills with no MetaBoost counterpart.

## ADOPT

| Skill | Notes |
| --- | --- |
| `logging` | Log dir / console policy |
| `observability` | OTLP/metrics patterns where applicable |
| `github` | gh CLI / PR workflow for agents |
| `git-worktree-sibling` | Parallel branch worktrees |
| `parallel-plan-execution` | Multi-agent plan runs |
| `plan-completion` | Final verification commands; cross-link MB `plan-files-convention` |

## Reconcile

| MB existing | Action |
| --- | --- |
| `plan-files-convention` | **KEEP**; merge plan-completion COPY-PASTA dedupe policy |
| `plan-execution-completion-tracking` rule | Reconcile with Podverse `plan-lifecycle` in abcmemory-align |

## Steps

1. Port skills from Podverse; adapt repo names.
2. Update `.cursor/skills/INDEX.md` if used.

## Verification

```bash
test -f .cursor/skills/github/SKILL.md && echo ok
```
