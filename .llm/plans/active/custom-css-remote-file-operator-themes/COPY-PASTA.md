# COPY-PASTA prompts (deferred mirror)

## Prompt 1 — Contract parity

Execute `01-contract-parity.md` to ensure Metaboost contract and fallback semantics exactly match the coordinating Podverse plan.

## Prompt 2 — Runtime and theme system

Execute `02-metaboost-runtime-and-theme-system.md` for env/runtime-config wiring, dynamic registry, SSR no-FOUC, and `next.config` decision points.

## Prompt 3 — E2E matrix

Execute `03-metaboost-e2e-matrix.md` to cover all env combinations plus fetch/validation failure fallback.

## Prompt 4 — Abcmemory/doc sync

Execute `04-abcmemory-and-doc-sync.md` so example fixture and docs stay aligned with CSS variable changes.

## Completion tracking

Per **plan-execution-completion-tracking** rule and **plan-files-convention** skill:

1. Mark each prompt `[x]` below when done.
2. Move each finished `NN-*.md` to `.llm/plans/completed/custom-css-remote-file-operator-themes/`.
3. When all four prompts are done, move the whole set:

```bash
mv .llm/plans/active/custom-css-remote-file-operator-themes .llm/plans/completed/
```
