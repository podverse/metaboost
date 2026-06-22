# MetaBoost abcmemory align — Copy-Pasta

## Phase 1 (sequential)

### Agent 1 — [x]

```
Read and execute .llm/plans/active/metaboost-abcmemory-align/01-adopt-podverse-process-rules.md

Add missing Podverse process rules to MetaBoost .cursor/rules (adapt paths). Reconcile plan-lifecycle
with plan-execution-completion-tracking.
```

### Agent 2 — [x]

```
Read and execute .llm/plans/active/metaboost-abcmemory-align/02-port-drifted-shared-rules.md

Port drifted shared rules from Podverse; preserve MetaBoost E2E_API_GATE_MODE policy in
end-with-targeted-make-report-verify.
```

**Wait for Agent 2 before Phase 2.**

## Phase 2 (parallel)

### Agent 3A — [x]

```
Read and execute .llm/plans/active/metaboost-abcmemory-align/03-port-drifted-shared-skills.md

Port drifted shared skills from Podverse with @metaboost/* and MB doc paths.
```

### Agent 3B — [x]

```
Read and execute .llm/plans/active/metaboost-abcmemory-align/04-align-cursorrules.md

Merge Podverse LLM workflow sections into .cursorrules; keep MetaBoost-specific test/git policy.
```

When all complete, move this set to `.llm/plans/completed/metaboost-abcmemory-align/`.

## Completion tracking

Per **plan-execution-completion-tracking** rule: mark each agent prompt `[x]` when done; move each
finished `NN-*.md` to `.llm/plans/completed/metaboost-abcmemory-align/`; then move the whole set.

```bash
npm run lint
grep -n "operator-only" .cursor/rules/operator-only-git-operations.mdc .cursorrules
```
