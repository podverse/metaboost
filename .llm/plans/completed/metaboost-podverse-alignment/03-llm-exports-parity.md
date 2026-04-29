## Plan: .llm Exports Exact Parity

Ensure Metaboost .llm exports process matches Podverse behavior and governance model as closely as possible.

## Steps
1. Diff scripts/llm behavior against Podverse.
2. Diff related Cursor files against Podverse (`.cursor/skills/**`, `.cursor/rules/**`, `.cursorrules`) for LLM export governance and source-of-truth guidance.
3. Align target allowlist, adapter wiring, local write gating, and check semantics.
4. Align guard script behavior for generated export paths.
5. Align workflow triggers and branch strategy for sync and full sync.
6. Align docs and rules describing source-of-truth and operator flow.
7. Verify generated target trees and restore behavior.
8. Record a Podverse reference-alignment checklist with match, intentional divergence, and rationale.

## Relevant files
- scripts/llm/export-from-cursor.mjs
- scripts/llm/allowed-targets.mjs
- scripts/llm/guard-exports-prompt.sh
- .github/workflows/llm-exports-sync.yml
- .github/workflows/llm-exports-full-sync.yml
- docs/development/llm/DOCS-DEVELOPMENT-LLM.md
- docs/development/llm/EXPORT-TARGETS.md
- .llm/exports/LLM-EXPORTS.md
- .cursor/rules/llm-exports-ci.mdc
- .cursor/rules/llm-cursor-source.mdc

## Verification
1. llm:exports:sync and llm:exports:sync:full behavior matches expected policy.
2. Guard rejects manual generated-file commits by default.
3. Workflow dry run and trigger logic matches intended parity.
4. Parity checklist is complete with no unresolved unknowns.

## Decisions
- Keep one canonical source-of-truth model.
- Generated exports owned by automation workflow path.
- Cursor alignment is first-class in this phase where files govern LLM export behavior.
