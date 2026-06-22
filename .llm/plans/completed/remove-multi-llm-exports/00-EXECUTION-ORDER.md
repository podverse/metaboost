# Execution order — Remove multi-LLM exports (Metaboost)

Run prompts from [COPY-PASTA.md](./COPY-PASTA.md).

**Coordination:** Podverse plans 01–04 should land first or in parallel; see `podverse/.llm/plans/active/remove-multi-llm-exports/00-EXECUTION-ORDER.md`.

## Phase 1 — Metaboost pipeline removal

| Step | Plan | Outcome |
| ---- | ---- | ------- |
| 1.1 | [01-remove-scripts-and-ci.md](./01-remove-scripts-and-ci.md) | No export scripts or CI |
| 1.2 | [02-remove-exports-tree-and-gitignore.md](./02-remove-exports-tree-and-gitignore.md) | No `.llm/exports/` |

## Phase 2 — Metaboost guidance and docs

| Step | Plan | Outcome |
| ---- | ---- | ------- |
| 2.1 | [03-rewrite-cursor-guidance.md](./03-rewrite-cursor-guidance.md) | Cursor-only rules/skills |
| 2.2 | [04-revise-llm-docs.md](./04-revise-llm-docs.md) | Export docs removed |

**Gate:** `./scripts/nix/with-env npm run lint` passes.

## Phase 3 — Remote cleanup (after merge)

| Step | Plan | Outcome |
| ---- | ---- | ------- |
| 3.1 | [06-remote-and-operator-cleanup.md](./06-remote-and-operator-cleanup.md) | GitHub branches/PRs cleaned (both repos) |

See Podverse plan 06 for identical remote steps.
