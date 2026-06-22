---
name: parallel-plan-execution
description: Create decomposed, parallelizable execution plans with copy-pasta prompts for multi-agent workflows. Use when planning large migrations, refactoring tasks, or any work that can benefit from parallel execution across multiple agents.
---

# Parallel Plan Execution Strategy

This skill guides you through creating execution plans that can be efficiently parallelized across
multiple Cursor agents, maximizing throughput while minimizing user effort.

## When to Use This Skill

Use this approach when:

- Working on tasks affecting 10+ files
- Multiple independent changes can be made simultaneously
- User wants to leverage parallel agent execution
- Task can be broken into logical, independent units of work

## Core Principles

> **AGENT BEHAVIOR**: When a copy-pasta prompt is pasted, execute it immediately. The act of pasting
> IS the instruction to execute. See "Executing Copy-Pasta Prompts" below.

### 1. Dependency Analysis

Before creating plans, identify:

- **Sequential dependencies**: Task B requires Task A completion (phases must run in order)
- **Parallel opportunities**: Tasks can execute simultaneously (agents within a phase)
- **Shared resources**: Files modified by multiple tasks (requires coordination)

**Critical distinction**:

- **Phases**: Run sequentially (Phase 1 completes → Phase 2 starts → Phase 3 starts).
- **Within a phase, order matters.** If the "How to use" says "run A, then B, then C and D in
  parallel", that means: run A → **wait for A to finish** → run B → **wait for B to finish** →
  then run C and D in parallel; **wait for all agents in the parallel group** before the next phase.
- **Agents marked "in parallel"** in the same step run simultaneously; do not start them until any
  "then" steps before them in that phase are done.

### 2. Plan Hierarchy

Create a clear hierarchy:

```
feature-00-EXECUTION-ORDER.md    # Master orchestration guide
feature-00-SUMMARY.md            # Complete scope and file inventory
feature-01-area-1.md             # Focused execution plan
feature-02-area-2.md             # Focused execution plan
...
feature-COPY-PASTA.md            # Ready-to-paste agent prompts
```

Plans live under `.llm/plans/active/[plan-set-name]/`. See **plan-files-convention**.

### 3. DRY Principle for Plans

**Detailed plans**: Keep full instructions, file lists, and code examples in numbered plan files.
**Copy-pasta file**: Should **reference** plan files, not duplicate their content.

Example copy-pasta prompt:

```
Read and execute .llm/plans/active/feature/08-dashboard-pages.md

Follow all instructions to update 5 dashboard-related files.

Core rule: [One-line reminder of key principle]
```

## Step-by-Step Workflow

### Step 1: Analyze Scope

1. Count affected files
2. Group by feature area, directory, or logical domain
3. Map dependencies
4. Estimate complexity

### Step 2: Create Master Summary

File: `00-SUMMARY.md` — total file count, breakdown, strategy overview.

### Step 3: Create Execution Order

File: `00-EXECUTION-ORDER.md` — phases (critical path sequential, feature groups parallel).

### Step 4: Create Focused Execution Plans

One file per parallelizable group with scope, per-file instructions, and verification commands.

### Step 5: Create Copy-Pasta File

File: `COPY-PASTA.md`

**CRITICAL**: Make execution rules clear at the top:

- Phases are **SEQUENTIAL** (must wait for each to complete)
- Agents **WITHIN** phases run in **PARALLEL** when marked

## Naming Conventions

- `00-` prefix: Meta files (summary, execution order)
- `01-99`: Execution plans (numbered by phase/group)
- Descriptive names: `08-dashboard-pages.md` not `08.md`

## Anti-Patterns to Avoid

- Do not copy all details into copy-pasta prompts — reference plan files
- Do not create artificial parallelization (files that could conflict)
- Do not make phases too granular (1 file per plan); group related files (3–7 per plan)
- Do not skip verification steps

## Executing Copy-Pasta Prompts

When a copy-pasta prompt from `COPY-PASTA.md` is pasted:

1. **Execute immediately** — do not ask for confirmation
2. **Prompt is self-contained** — read the referenced plan file and implement
3. **Recognition**: message references `.llm/plans/active/...` with no extra user instructions

### Final COPY-PASTA step

When the pasted prompt is the **last** step in the plan set:

- Assume the operator ran all prior COPY-PASTA prompts without running tests.
- After implementation and plan archiving, end the response with **all** cumulative verification
  commands for the entire set in one fenced `bash` block (see **response-ending-make-verify** and
  **plan-completion** skills).

## Related Skills

- **plan-files-convention** — directory layout and when to stop at plan creation
- **plan-completion** — move finished plans to `completed/`
- **plan-execution-completion-tracking** rule — mark COPY-PASTA progress during execution
- **response-ending-make-verify** — operator verification commands
