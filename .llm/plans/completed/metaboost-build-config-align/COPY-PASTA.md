# MetaBoost build config align — Copy-Pasta

### Agent 1 — [x]

```
Read and execute .llm/plans/active/metaboost-build-config-align/01-fix-eslint-stale-globs-and-commit-rules.md
```

### Agent 2 — [x]

```
Read and execute .llm/plans/active/metaboost-build-config-align/02-complete-vitest-package-wiring.md
```

### Agent 3 — [x]

```
Read and execute .llm/plans/active/metaboost-build-config-align/03-remove-lint-staged-from-package-json.md

Run after metaboost-dev-scripts-align plan 01 if dropping pre-commit in the same PR.
```

Move set to `.llm/plans/completed/metaboost-build-config-align/` when complete.

## Completion tracking

Per **plan-execution-completion-tracking** rule: mark each agent prompt `[x]` when done; move each
finished `NN-*.md` to `.llm/plans/completed/metaboost-build-config-align/`; then move the whole set.
