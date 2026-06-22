# MetaBoost abcmemory align — Execution order

## Phase 1 — Rules (sequential)

1. `01-adopt-podverse-process-rules.md` — add missing Podverse process rules first.
2. `02-port-drifted-shared-rules.md` — port drifted shared rules (depends on new rules existing for cross-refs).

## Phase 2 — Skills + root config (parallel-safe)

3. `03-port-drifted-shared-skills.md` — port drifted skills (parallel with 4).
4. `04-align-cursorrules.md` — update `.cursorrules` (parallel with 3).

**Wait for Phase 2 before moving this set to `completed/`.**

When done: `mv .llm/plans/active/metaboost-abcmemory-align .llm/plans/completed/`
