# Copy-Paste Prompts

Use these prompts to execute the plan files in order from `00-EXECUTION-ORDER.md`.

## Phase 1 (Sequential)

### 1) Execute Plan 01

```text
Execute `.llm/plans/active/metaboost-security-audit/01-sql-query-inventory-and-triage.md` exactly as written.
Produce the SQL inventory report with classifications and the hotspot list for plan 02. Do not implement code fixes yet.
```

### 2) Execute Plan 02

```text
Execute `.llm/plans/active/metaboost-security-audit/02-sql-dataflow-verification.md` exactly as written.
Use the hotspot list from plan 01, complete deep SQL dataflow verification, and produce exploitability decisions. Do not implement code fixes yet.
```

## Phase 2 (Parallel Allowed)

Run the next three prompts in parallel after Phase 1 is done.

### 3A) Execute Plan 03

```text
Execute `.llm/plans/active/metaboost-security-audit/03-non-sql-auth-session-cors.md` exactly as written.
Produce the auth/session/CORS findings report with severity ratings and hardening recommendations. Do not implement code fixes yet.
```

### 3B) Execute Plan 04

```text
Execute `.llm/plans/active/metaboost-security-audit/04-non-sql-outbound-requests-and-ssrf.md` exactly as written.
Produce the outbound/SSRF and integrator trust-boundary report with exploit preconditions and mitigation options. Do not implement code fixes yet.
```

### 3C) Execute Plan 05

```text
Execute `.llm/plans/active/metaboost-security-audit/05-web-management-surface-review.md` exactly as written.
Produce the web/management-web attack-surface findings report with redirect/header trust analysis. Do not implement code fixes yet.
```

## Phase 3 (Sequential)

### 4) Execute Plan 06

```text
Execute `.llm/plans/active/metaboost-security-audit/06-joint-findings-remediation-and-regression-guards.md` exactly as written.
Consolidate plans 01-05 into one final severity-ranked security report and remediation backlog.
```
