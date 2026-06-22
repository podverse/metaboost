# MetaBoost LLM workspace align — Summary

## Purpose

Align MetaBoost `.llm/` workspace layout docs and `docs/development/llm/` contributor policy with
Podverse after triage Plan 04. **Do not** replace MetaBoost-specific `architecture.md` with Podverse
content.

## Plans

| File | Focus |
| --- | --- |
| 01-align-llm-root-and-dev-docs.md | `.llm/LLM.md`, `DOCS-DEVELOPMENT-LLM.md`, history archive |
| 02-align-llm-index-and-context.md | Index files, `LLM-CONTEXT.md`, `conventions.md` |
| 03-cleanup-llm-local.md | Remove or document empty `.llm/local/` |
| 04-complete-feature-workflow-gap.md | Optional: adopt Podverse `complete-feature.yml` or document manual-only history |

## Verification

```bash
diff <(find .llm -maxdepth 2 -type d | sort) <(cd ../podverse && find .llm -maxdepth 2 -type d | sort)
rg -n "llm/exports" .llm/LLM.md docs/development/llm/DOCS-DEVELOPMENT-LLM.md
```
