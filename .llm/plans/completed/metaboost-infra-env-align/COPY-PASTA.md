# MetaBoost infra env align — Copy-Pasta

### Agent 1 — [x]

```
Read and execute .llm/plans/active/metaboost-infra-env-align/01-sync-k8s-env-sources-with-templates.md
```

### Agent 2 — [x]

```
Read and execute .llm/plans/active/metaboost-infra-env-align/02-regenerate-linear-baseline-gz.md
```

### Agent 3 — [x]

```
Read and execute .llm/plans/active/metaboost-infra-env-align/03-verify-alpha-product-membership-wiring.md

Push infra/k8s changes to the Argo CD–tracked branch when done.
```

Move set to `.llm/plans/completed/metaboost-infra-env-align/` when complete.

## Completion tracking

Per **plan-execution-completion-tracking** rule: mark each agent prompt `[x]` when done; move each
finished `NN-*.md` to `.llm/plans/completed/metaboost-infra-env-align/`; then move the whole set.
