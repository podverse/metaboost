---
description: "Only one README.md in the Metaboost monorepo (at repo root)"
applyTo:
  - "**/README.md"
  - ".llm/**/*.md"
  - "**/INDEX.md"
---

# Single README

The Metaboost monorepo has **exactly one README.md**, at the **repository root**. Do not create `README.md` in subdirectories.

For directory docs use **full-path names** (e.g. `INFRA-K8S.md`, `PACKAGES-UI.md`) per the documentation-conventions skill. The only `INDEX.md` is `.llm/exports/github-copilot/skills/INDEX.md`; plan-set indexes use `00-overview.md` or `00-master-plan.md`.
