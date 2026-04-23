---
name: single-readme
description: The Metaboost monorepo has exactly one README.md (at repo root). Use when adding index/overview docs or creating new directories so you do not add a second README.
version: 1.0.0
---

# Single README (Metaboost)

The **Metaboost monorepo must have exactly one README.md**, at the **repository root** (`README.md`).

## Do

- Keep the single project README at the repo root.
- For directory docs use **full-path names** (e.g. `INFRA-K8S.md`, `PACKAGES-UI.md`) per the documentation-conventions skill.
- The only `INDEX.md` in the repo is `.github/skills/INDEX.md`. Plan-set indexes under `.llm/plans/` use `00-overview.md` or `00-master-plan.md`.

## Don't

- Do **not** create `README.md` in any subdirectory (apps, packages, infra, .llm/plans, .cursor/skills, etc.).
- Do not add a second README or a second INDEX when introducing a new area; use the full-path doc name instead.

## When to use this skill

- Adding new documentation or index files.
- Creating new directories that need an overview or index.
- Planning or editing docs under `.llm/`, `infra/`, `packages/`, `apps/`, or `.cursor/`.
