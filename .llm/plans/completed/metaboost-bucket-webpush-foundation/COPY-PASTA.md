# Copy-Paste Prompts

Use these prompts to execute plans in **strict sequential order** from [`00-EXECUTION-ORDER.md`](./00-EXECUTION-ORDER.md). Finish each step before starting the next.

Paths below are relative to the **Metaboost** repository root.

After completing a step, update this file to mark the step completed (per **plan-execution-completion-tracking**) and move completed numbered plans to `.llm/plans/completed/metaboost-bucket-webpush-foundation/` when appropriate.

---

## Phase 1 — Backend schema and domain

### Step 1 — `01-backend-domain-and-schema`

**Status:** completed (see `.llm/plans/completed/metaboost-bucket-webpush-foundation/01-backend-domain-and-schema.md`).

```text
Implement plan file `.llm/plans/completed/metaboost-bucket-webpush-foundation/01-backend-domain-and-schema.md` exactly as written.
Follow Metaboost linear migrations and ORM conventions (forward-only SQL under infra/k8s, ops kustomization bundle sync if adding migration files).
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```

---

## Phase 2 — API and Web Push channel

### Step 2 — `02-api-and-webpush-channel`

**Status:** completed (see `.llm/plans/completed/metaboost-bucket-webpush-foundation/02-api-and-webpush-channel.md`).

```text
Implement plan file `.llm/plans/completed/metaboost-bucket-webpush-foundation/02-api-and-webpush-channel.md` exactly as written.
Assume step 1 (01-backend-domain-and-schema) is complete.
Include Joi schemas, helpers-requests types, non-blocking dispatch on message persistence, and threshold-aware gating per the plan.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```

---

## Phase 3 — Web UI and service worker

### Step 3 — `03-web-ui-and-service-worker`

**Status:** completed (see `.llm/plans/completed/metaboost-bucket-webpush-foundation/03-web-ui-and-service-worker.md`).

```text
Implement plan file `.llm/plans/completed/metaboost-bucket-webpush-foundation/03-web-ui-and-service-worker.md` exactly as written.
Assume steps 1–2 are complete so APIs and contracts exist.
Reuse existing bucket scope-modal patterns where the plan says to align UX.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```

---

## Phase 4 — Env, VAPID, local setup

### Step 4 — `04-env-vapid-and-local-setup`

**Status:** completed (see `.llm/plans/completed/metaboost-bucket-webpush-foundation/04-env-vapid-and-local-setup.md`).

```text
Implement plan file `.llm/plans/completed/metaboost-bucket-webpush-foundation/04-env-vapid-and-local-setup.md` exactly as written.
Assume steps 1–3 are complete so required env keys and runtime surfaces are known from implemented code.
Keep canonical `.env.example`, sidecar, and local env override flows aligned per Metaboost env conventions.
Do not modify unrelated files.
When done, summarize changed files and any follow-up risks.
```

---

## Phase 5 — Tests and verification

### Step 5 — `05-tests-and-verification`

**Status:** completed (see `.llm/plans/completed/metaboost-bucket-webpush-foundation/05-tests-and-verification.md`).

```text
Implement plan file `.llm/plans/completed/metaboost-bucket-webpush-foundation/05-tests-and-verification.md` exactly as written.
Assume steps 1–4 are complete.
Add or update API integration tests and web E2E tests per the plan; do not skip threshold/dispatch or inheritance cases listed there.
Do not modify unrelated files.
When done, summarize changed files, verification commands run (or to run locally), and any follow-up risks.
```
