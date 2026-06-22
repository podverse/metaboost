# 02 — Align LLM index and context

## Scope

Sync index/helper docs under `.llm/`; **do not** overwrite MetaBoost `architecture.md` with Podverse.

## Files

| File | Action |
| --- | --- |
| `plans/active/LLM-PLANS-ACTIVE.md` | Align wording with Podverse; keep MB skill names |
| `plans/completed/LLM-PLANS-COMPLETED.md` | Same if present |
| `history/active/LLM-HISTORY-ACTIVE.md` | Compare to Podverse; align if drifted |
| `context/LLM-CONTEXT.md` | Port Podverse structure |
| `context/conventions.md` | Port generic Podverse sections (git branches, naming); keep MB references |
| `context/architecture.md` | **Review only** — verify MB tier table matches current packages; update if stale, do not copy Podverse tiers |

## Verification

```bash
test -f .llm/context/architecture.md && grep -n "management-orm" .llm/context/architecture.md
```
