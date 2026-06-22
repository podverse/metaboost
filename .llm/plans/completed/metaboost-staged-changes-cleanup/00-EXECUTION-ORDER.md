# 00 - Execution order - Metaboost staged-changes cleanup

**Copy-paste prompts:** [COPY-PASTA.md](./COPY-PASTA.md)

## Phase order

Each phase is sequential. Within Phase 1 + Phase 2 there are no internal parallel
groups; their underlying steps are short. Phases 3 and 4 can run in parallel after
Phase 2 if two agents are available, since they touch disjoint files; otherwise run
them sequentially.

1. [01-error-boundaries-shared-ui.md](./01-error-boundaries-shared-ui.md) (completed)
2. [02-notification-dispatch-perf.md](./02-notification-dispatch-perf.md) (completed)
3. [03-shared-api-contract-types.md](./03-shared-api-contract-types.md) (completed)
4. [04-schema-and-error-helpers.md](./04-schema-and-error-helpers.md) (completed)
5. [05-helpers-and-bell-refactor.md](./05-helpers-and-bell-refactor.md) (completed)
6. [06-style-and-import-hygiene.md](./06-style-and-import-hygiene.md) (completed)

## Why this order

- **Phase 1 first** - largest single-PR DRY win and unblocks any future shared-UI
  consumers; touches `@metaboost/ui` only and two thin app wrappers, so it cannot
  break server code while the rest of the cleanup is in flight.
- **Phase 2 next** - real correctness/scaling fixes (N+1 query, serial sends,
  per-row descendant upsert). Independent from Phase 1, so could swap if needed.
- **Phase 3** before Phases 4/5 because moving the canonical TS types to
  `helpers-requests` lets later phases import them without duplication.
- **Phase 4** small dedup phase; safe to run in parallel with Phase 3 if the
  `helpers-requests` exports are already merged.
- **Phase 5** is the largest cleanup phase and depends on the type-shape work in
  Phases 3-4 and the helpers added there.
- **Phase 6** is style + import hygiene and runs last so it can verify Phase 1's
  shared components carry no inline styles either.

## Parallel-execution guidance

- Phases 3 and 4 are file-disjoint after Phase 2 lands. If running with two
  agents, kick them off together; otherwise sequential.
- Phase 5 always runs after both 3 and 4 are merged (it imports their helpers).
