# Remove multi-LLM export system — summary (Metaboost)

Created: 2026-05-23  
Scope: **Metaboost** (mirrors Podverse export removal).

## Goal

Same as Podverse: retire multi-editor LLM export tooling. **Cursor-only** going forward — `.cursor/` + `.cursorrules` are the sole AI guidance source.

## Coordination with Podverse

Podverse owns the master execution order at:

`podverse/.llm/plans/active/remove-multi-llm-exports/`

This Metaboost directory contains **repo-local plans 01–04** (Metaboost paths). Execute via Podverse plan **05-metaboost-parity.md** or run these plans directly.

Recommended order:

1. Complete Podverse plans 01–04
2. Complete Metaboost plans 01–04 (this directory)
3. Run remote cleanup (plan 06 in either repo)

## Plan files (Metaboost)

| File | Focus |
| ---- | ----- |
| [01-remove-scripts-and-ci.md](./01-remove-scripts-and-ci.md) | Delete `scripts/llm/`, workflows, npm scripts, pre-commit guard |
| [02-remove-exports-tree-and-gitignore.md](./02-remove-exports-tree-and-gitignore.md) | Delete `.llm/exports/`, clean gitignore/cursorignore |
| [03-rewrite-cursor-guidance.md](./03-rewrite-cursor-guidance.md) | Delete export skill/rule; simplify `llm-cursor-source`; update INDEX, AGENTS.md |
| [04-revise-llm-docs.md](./04-revise-llm-docs.md) | Delete export docs; rewrite `DOCS-DEVELOPMENT-LLM.md` |
| [06-remote-and-operator-cleanup.md](./06-remote-and-operator-cleanup.md) | GitHub branch/PR cleanup (both repos) |

## Keep

- `.cursor/**`, `.llm/plans/`, `.llm/history/`, `.llm/context/`
- `i18n-llm-translations` (unrelated)
- Completed plan archives mentioning exports

## Metaboost-specific

- Update `.cursor/skills/INDEX.md` (remove `llm-exports-scripts`)
- Update `docs/QUICK-START.md` if it references exports
- No `complete-feature.yml` in Metaboost

Execute via [00-EXECUTION-ORDER.md](./00-EXECUTION-ORDER.md) and [COPY-PASTA.md](./COPY-PASTA.md).
