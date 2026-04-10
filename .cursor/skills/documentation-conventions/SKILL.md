---
name: metaboost-documentation-conventions
description: Documentation file naming for the Metaboost repo. Use when creating or modifying docs, README, or markdown.
version: 1.1.0
---

# Documentation Conventions

## Single README

- **One** `README.md` at repository root.
- **Only one file in the entire repository may be named README** (the root `README.md`). Subdirectories must use descriptive names (e.g. `scripts/github/SCRIPTS-GITHUB.md`, not `README.md`).

## Directory-Specific Docs

Name after the full path from root (uppercase, slashes → hyphens):

- `apps/api/` → `APPS-API.md`
- `apps/web/` → `APPS-WEB.md`
- `infra/k8s/` → `INFRA-K8S.md`
- `packages/ui/` → `PACKAGES-UI.md`
- `scripts/github/` → `SCRIPTS-GITHUB.md`
- `.llm/` → `LLM.md`

Pattern: `[FULL-PATH-WITH-HYPHENS].md`. Do not add multiple `README.md` files per directory.

## INDEX.md and plan indexes

- The **only** `INDEX.md` in the repo is `.cursor/skills/INDEX.md` (skills quick reference). All other directory overviews use the full-path name (e.g. `INFRA-K8S.md`, `PACKAGES-UI.md`).
- Plan-set indexes under `.llm/plans/` use `00-overview.md` or `00-master-plan.md`, not INDEX.md or README.md.
