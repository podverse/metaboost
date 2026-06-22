# MetaBoost LLM exports reference cleanup — Copy-Pasta

## Agent 1 — [x]

```
Read and execute .llm/plans/active/metaboost-llm-exports-reference-cleanup/01-remove-stale-eslint-llm-glob.md

Remove the dead scripts/llm ESLint override block. When done, move this plan set to
.llm/plans/completed/metaboost-llm-exports-reference-cleanup/.
```

## Completion tracking

Per **plan-execution-completion-tracking** rule: mark Agent 1 `[x]` when done; move
`01-remove-stale-eslint-llm-glob.md` to `.llm/plans/completed/metaboost-llm-exports-reference-cleanup/`;
then move the whole set.

## Verification

```bash
rg -n "scripts/llm" /Users/mitcheldowney/repos/pv/metaboost --glob '!.llm/plans/**' || echo "clean"
npm run lint
```
