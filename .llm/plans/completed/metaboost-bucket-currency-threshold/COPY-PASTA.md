# Copy-Paste Prompts

Use these prompts to execute plans in required order from `00-EXECUTION-ORDER.md`.

## Phase 1

### Step 1 - 01-domain-model-and-schema (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/01-domain-model-and-schema.md` exactly as written.
Use clean-slate schema updates only (`CREATE TABLE` definitions); do not add or retain backward-compatibility `ALTER TABLE`/backfill migration paths or comments.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```

### Step 2 - 02-bucket-settings-api-and-cascade (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/02-bucket-settings-api-and-cascade.md` exactly as written.
Assume `01-domain-model-and-schema` is already complete.
When done, summarize changed files and any follow-up risks.
```

## Phase 2

### Step 3 - 03-conversion-service-and-currency-catalog (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/03-conversion-service-and-currency-catalog.md` exactly as written.
Assume phases 1 steps are complete.
Enforce strict denomination syntax: require explicit `amount_unit`, reject missing/ambiguous units, and do not add backward-compatibility fallbacks.
When done, summarize changed files and any follow-up risks.
```

### Step 4 - 04-public-conversion-endpoint-and-bucket-response-url (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/04-public-conversion-endpoint-and-bucket-response-url.md` exactly as written.
Assume phases 1-2 step 3 are complete.
Require explicit denomination in conversion endpoint inputs and enforce strict unit validation (no implicit defaults).
When done, summarize changed files and any follow-up risks.
```

## Phase 3

### Step 5 - 09-threshold-filter-sql-path-and-query-rename (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/09-threshold-filter-sql-path-and-query-rename.md` exactly as written.
Assume phases 1-2 are complete.
Treat `minimumAmountMinor` as the canonical list/read threshold query parameter and remove runtime handling of `minimumAmountUsdCents`.
When done, summarize changed files and any follow-up risks.
```

### Step 6 - 10-legacy-row-behavior-and-contract-clarity (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/10-legacy-row-behavior-and-contract-clarity.md` exactly as written.
Assume step 5 is complete.
Document legacy/non-convertible row behavior under active thresholds and align OpenAPI/spec docs with strict denomination requirements.
When done, summarize changed files and any follow-up risks.
```

## Phase 4

### Step 7a - 05-metaboost-web-exchange-rates-page (parallel) (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/05-metaboost-web-exchange-rates-page.md` exactly as written.
Assume phases 1-3 are complete.
When done, summarize changed files and any follow-up risks.
```

### Step 7b-1 - 06a-podverse-metaboost-bucket-context-plumbing (parallel) (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06a-podverse-metaboost-bucket-context-plumbing.md` exactly as written.
Assume phases 1-3 are complete.
This step includes changes in the Podverse repo and must preserve cross-surface bucket context plumbing for all Metaboost-enabled v4v boost forms (`mb-v1` and `mbrss-v1`), not donate-only.
When done, summarize changed files and any follow-up risks.
```

### Step 7b-2 - 06b-podverse-conversion-request-plumbing (after 7b-1) (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06b-podverse-conversion-request-plumbing.md` exactly as written.
Assume phases 1-3 and step 7b-1 are complete.
Require explicit `amount_unit` in conversion inputs; do not guess denomination units.
When done, summarize changed files and any follow-up risks.
```

### Step 7b-3 - 06c-podverse-threshold-gating-donate-form (after 7b-2) (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06c-podverse-threshold-gating-donate-form.md` exactly as written.
Assume phases 1-3 and steps 7b-1 through 7b-2 are complete.
When done, summarize changed files and any follow-up risks.
```

### Step 7b-4 - 06d-podverse-threshold-gating-podcast-episode-forms (after 7b-3) (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06d-podverse-threshold-gating-podcast-episode-forms.md` exactly as written.
Assume phases 1-3 and steps 7b-1 through 7b-3 are complete.
This step must cover all Metaboost-enabled v4v boost forms (`mb-v1` and `mbrss-v1`), not donate-only.
When done, summarize changed files and any follow-up risks.
```

### Step 7b-5 - 06e-podverse-threshold-error-handling-and-i18n (after 7b-4) (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/06-podverse-threshold-conversion-ux/06e-podverse-threshold-error-handling-and-i18n.md` exactly as written.
Assume phases 1-3 and steps 7b-1 through 7b-4 are complete.
Do not guess denomination units in UI logic; require explicit unit metadata and surface deterministic errors when unit data is invalid/missing.
When done, summarize changed files and any follow-up risks.
```

### Step 7c - 11-podverse-boost-form-currency-input-formatting (after 7b-5) (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/11-podverse-boost-form-currency-input-formatting.md` exactly as written.
Assume phases 1-3 and steps 7b-1 through 7b-5 are complete.
In this step, create/lock the shared currency input formatter/parser utility contract only; do not perform full per-form wiring yet.
When done, summarize changed files and any follow-up risks.
```

### Step 7d - 12-podverse-boost-form-currency-input-integration (after 7c) (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/12-podverse-boost-form-currency-input-integration.md` exactly as written.
Assume phases 1-3, steps 7b-1 through 7b-5, and step 7c are complete.
Integrate the shared utility across all Metaboost-enabled Podverse boost form surfaces so precision, symbol prefix, and minor-unit normalization are consistent.
When done, summarize changed files and any follow-up risks.
```

### Step 7e - 13-podverse-boost-form-currency-input-validation-and-e2e (after 7d) (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/13-podverse-boost-form-currency-input-validation-and-e2e.md` exactly as written.
Assume phases 1-3, steps 7b-1 through 7b-5, and steps 7c-7d are complete.
Finalize validation/i18n behavior and add Podverse E2E coverage for per-currency decimal precision + symbol-prefix rules, including BTC/sats no-symbol/no-decimal behavior.
When done, summarize changed files and any follow-up risks.
```

## Phase 5

### Step 8 - 07-openapi-docs-env-and-k8s (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/07-openapi-docs-env-and-k8s.md` exactly as written.
Assume phases 1-4 are complete (including steps 7c-7e).
OpenAPI and docs must explicitly state strict denomination requirements (`amount_unit` required).
When done, summarize changed files and any follow-up risks.
```

### Step 9 - 08-test-plan (completed)
```text
Implement plan file `.llm/plans/completed/metaboost-bucket-currency-threshold/08-test-plan.md` exactly as written.
Assume prior phases are complete.
Update/add required API integration tests and web/management-web E2E tests, plus Podverse web E2E where impacted.
Include coverage for strict denomination validation and ambiguous/missing `amount_unit` rejection paths.
Include coverage for per-currency decimal precision + symbol-prefix amount-input behavior in Podverse boost forms.
When done, summarize changed files and any follow-up risks.
```
