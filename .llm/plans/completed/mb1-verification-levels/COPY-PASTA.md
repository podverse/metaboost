# COPY-PASTA Prompts

Use these prompts one by one (or in the explicit parallel phase) to execute this plan set.

## Phase 1

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/01-SPEC-AND-DATA-CONTRACTS.md`.
Do not edit other plan files. Keep changes scoped to the contract/spec work in this file.
```

## Phase 2

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/02-METABOOST-DB-AND-ORM.md`.
Do not edit other plan files. Keep changes scoped to DB/ORM work in this file.
```

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/03-METABOOST-API-CONFIRM-PAYMENT-AND-FILTERS.md`.
Do not edit other plan files. Keep changes scoped to API contract/controller/filter work in this file.
```

## Phase 3 (parallel allowed)

Run the next 3 prompts in parallel only after Phase 2 is complete.

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/04-METABOOST-WEB-STATUS-ICONS-FILTERS-EXPAND.md`.
Do not edit other plan files. Keep changes scoped to web UI work in this file.
```

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/05-METABOOST-MANAGEMENT-API-WEB-ALIGNMENT.md`.
Do not edit other plan files. Keep changes scoped to management-api and management-web work in this file.
```

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/06-PODVERSE-INTEGRATION-AND-SIGNALING.md`.
Do not edit other plan files. Keep changes scoped to Podverse integration work in this file.
```

## Phase 4

```text
Implement plan file `.llm/plans/active/mb1-verification-levels/07-TESTS-AND-ROLLBACK.md`.
Do not edit other plan files. Keep changes scoped to test hardening and rollout/rollback updates.
```
