# 04 — Complete-feature workflow gap

## Scope

Podverse automates `.llm/history/active/` → `completed/` on PR merge via
`.github/workflows/complete-feature.yml`. MetaBoost lacks this workflow.

## Option A — Adopt (recommended for parity)

1. Copy/adapt `podverse/.github/workflows/complete-feature.yml` for MetaBoost (branch `develop`,
   paths under `.llm/history/`).
2. Ensure required GitHub App secrets exist (document in `docs/repo-management/` if needed).
3. Update `DOCS-DEVELOPMENT-LLM.md` and `.llm/LLM.md` to describe automation.

## Option B — Document manual-only

1. In `.llm/LLM.md` and `DOCS-DEVELOPMENT-LLM.md`, state history archival is **manual** in MetaBoost.
2. Reference `plan-execution-completion-tracking` rule for plan-set moves.

## Verification (Option A)

```bash
test -f .github/workflows/complete-feature.yml && echo ok
```
