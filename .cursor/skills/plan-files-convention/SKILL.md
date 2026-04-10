---
name: plan-files-convention
description: Where and how to save LLM plan files locally. Use when creating, saving, or completing plan sets (e.g. multi-phase plans). Aligns with Podverse monorepo convention.
version: 1.1.0
---

# Plan Files Convention

This skill describes how to save plan files locally in the Boilerplate repo, following the same convention as the Podverse monorepo.

## When Asked to Create a Plan That Is Too Big for One Pass

If the user asks you to create a plan and the plan is **too large to implement in a single pass**:

1. **First goal**: Treat the deliverable as **creating detailed plan files and saving them locally**. Do not attempt to implement the full plan in one go.
2. **Produce and save**:
   - A plan-set directory under `.llm/plans/active/[plan-set-name]/`
   - `00-EXECUTION-ORDER.md`, `00-SUMMARY.md`, numbered plan files (e.g. `01-topic.md` …), and `COPY-PASTA.md` as described below.
3. **After the plan files exist**: The user will use the **COPY-PASTA.md** (copy-pasta doc) to ask you to implement the plans—typically **one after another**, or **in parallel** when the execution order doc says it is safe (e.g. within a phase marked as parallel). Do not start implementation until the user requests it via those prompts.
4. When the user pastes a prompt from COPY-PASTA.md, execute that plan immediately (see parallel-plan-execution skill for copy-pasta behavior).

## Where to Save Plans

- **Active plans**: `.llm/plans/active/[plan-set-name]/`
- **Completed plans**: `.llm/plans/completed/[plan-set-name]/` (move here when the plan set is done)

Use a short, kebab-case name for the set (e.g. `boilerplate`, `web-runtime-config-endpoint`).

## Standard File Layout (Active Set)

Inside the plan-set directory, use:

- **00-EXECUTION-ORDER.md** – Phase order, parallel groups, and pointers to each numbered plan.
- **00-SUMMARY.md** – Scope summary, list of plan files, dependency map, and recorded decisions.
- **01-topic.md** … **NN-topic.md** – One markdown file per topic (e.g. `01-infra-directory.md`, `09-gitflow-test.md`). Each has: Scope, Steps, Key files, Verification.
- **COPY-PASTA.md** – Copy-paste prompts for parallel agents, referencing the numbered plans.

During **plan creation**, do not modify product code or test files. For plans that touch **api** or **management-api**, include explicit integration-test steps (see api-testing). For plans that touch **web** or **management-web**, include explicit E2E-test steps (see e2e-page-tests).

Plans stay under ~300 lines each; split into part files (e.g. `22-part-1-dashboard.md`) if a topic grows.

## How to use COPY-PASTA (execution order)

- **Phases are sequential.** Do not start Phase N+1 until Phase N is fully complete.
- **Within a phase,** steps can be sequential or parallel. When the doc says "run A, then B,
  then C and D in parallel" it means: run A → **wait for A to finish** → run B → **wait for
  B to finish** → then run C and D in parallel (e.g. two agents); **wait for both C and D**
  before starting the next phase. Only start "in parallel" work after all prior steps in
  that phase have completed.
- For each step or parallel group, wait for completion before starting the next step or
  phase.

## When Creating a New Plan Set

1. Create the directory: `.llm/plans/active/[plan-set-name]/`.
2. Add 00-EXECUTION-ORDER.md and 00-SUMMARY.md first.
3. Add one file per topic (01, 02, …) with scope, steps, key files, verification.
4. Add COPY-PASTA.md with copy-paste prompts that **reference** the numbered plan files (so the user can request implementation one-by-one or in parallel as allowed by the execution order).
5. **Stop when the plan files are saved.** Do not implement product code or test files in this pass. Implementation happens when the user uses COPY-PASTA.md to ask you to execute each plan (sequentially or in parallel per the execution order).

## When a Plan Set Is Complete

1. Move the entire directory from `active/` to `completed/`:  
   `mv .llm/plans/active/[plan-set-name] .llm/plans/completed/`
2. Update any cross-references (e.g. 00-master-plan or README) if needed.

## Reference

- Podverse: `.llm/plans/active/` and `.llm/plans/completed/`; see e.g. `podverse/.llm/plans/completed/web-runtime-config-endpoint/` for layout.
- Boilerplate: active plan sets live in topic-specific directories under `.llm/plans/active/`
  (e.g. `web-dashboard/`, `documentation-diagrams/`, `git-hooks/`, `jenkins-local/`,
  `deployment-installer-roadmap/`). Index: `.llm/plans/active/boilerplate/00-overview.md`.
  Completed: `.llm/plans/completed/boilerplate/`, `.llm/plans/completed/boilerplate-k3s/`.
