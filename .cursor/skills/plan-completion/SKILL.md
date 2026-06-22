---
name: plan-completion
description: When you finish a plan file in active/, automatically move it to completed/. If it's the last plan in its set, move the whole set. Use when completing any plan under .llm/plans/active/.
---

# Plan Completion and Archiving

When you **finish executing** a plan file that lives in `.llm/plans/active/`, archive it (and
optionally its whole set) without asking the user.

Metaboost also enforces COPY-PASTA progress tracking via the **plan-execution-completion-tracking**
rule — follow both this skill and that rule during plan-set execution.

## Automatic Move (Single Plan)

1. **After** you have finished executing a plan file (all steps done), move that plan file from
   `active/` to `completed/`, preserving subdirectory structure.
2. **Do not ask** "Would you like me to mark this plan as completed?" — move it automatically.
3. Update `COPY-PASTA.md` to mark the corresponding agent prompt `[x]` (per
   **plan-execution-completion-tracking**).

Example:

```bash
mv .llm/plans/active/metaboost-podverse-parity-gaps/03-adopt-podverse-engineering-ops-skills.md \
   .llm/plans/completed/metaboost-podverse-parity-gaps/
```

## When It's the Last Plan in a Set — Move the Whole Set

A **set** is any group of plan files that belong together, for example:

- Files listed in `00-EXECUTION-ORDER.md` or `COPY-PASTA.md`
- All `.md` files under one `active/<feature>/` directory

If the plan you just finished is the **last** numbered plan in that set (no other numbered plans
remain in `active/<feature>/`), move **all** remaining plan-set files from `active/<feature>/` to
`completed/<feature>/` in one go. Preserve directory structure.

Keep `COPY-PASTA.md` and `00-*` files in `active/` until all numbered prompts are complete; then move
the whole directory.

Example (last plan in set):

```bash
mv .llm/plans/active/metaboost-podverse-parity-gaps .llm/plans/completed/
```

## Preserve Structure

Always keep the same relative path under `completed/` as under `active/`:

- `active/feature-name/01-part.md` → `completed/feature-name/01-part.md`

## Optional: Update References

If `.llm/LLM.md`, `LLM-PLANS-ACTIVE.md`, or a `00-SUMMARY.md` references the moved plan(s), update
paths from `active/` to `completed/` where appropriate.

## Final COPY-PASTA step — cumulative verification

When completing the **last** numbered prompt in a set:

| Situation                       | Action                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Finished one plan in a set      | Move only that plan file to `completed/`; mark `[x]` in COPY-PASTA                                                        |
| Finished the last plan in a set | Move the whole set directory to `completed/`                                                                                |
| Last plan in set (COPY-PASTA)   | End response with **all** cumulative operator verification commands for the whole set (see **response-ending-make-verify**) |
| Don't ask                       | Archive automatically after the plan is done                                                                                |

Dedupe verification commands across the set; order: build/lint → unit → API (if applicable) → E2E
(if applicable). Default E2E commands **without** `E2E_API_GATE_MODE` unless API code changed.

## Related

- **plan-files-convention** — layout and COPY-PASTA dedupe policy
- **parallel-plan-execution** — creating parallel-safe plan sets
- **plan-execution-completion-tracking** rule — authoritative tracking during execution
- **response-ending-make-verify** — operator command block at end of implementation
