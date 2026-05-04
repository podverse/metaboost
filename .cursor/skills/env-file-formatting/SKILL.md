---
name: env-file-formatting
description: Env file value formatting and NEXT_PUBLIC ordering. Use when adding or editing .env,
  .env.example, or any *.env template in the repo.
---

# Env file formatting

## When to use

When adding or editing `.env`, `.env.example`, or any `*.env` template (including
`infra/config/env-templates/*.env.example`, `infra/k8s/**/source/*.env`, and `dev/env-overrides/local/*.env.example`).

## Rules

- **Non-empty values**: Double quotes. **Empty/unset**: no value after `=` (see `.cursor/rules/env-file-formatting.mdc`).
- **K8s `source/*.env` comments**: at most **one** env var name per `#` line.

## Variable order when mixing server and `NEXT_PUBLIC_*`

If a file defines both keys that are **not** `NEXT_PUBLIC_*` (e.g. `API_PORT`, `READINESS_*`,
`NODE_ENV`, `RUNTIME_CONFIG_*`) **and** any `NEXT_PUBLIC_*`:

1. All non-`NEXT_PUBLIC_*` assignments first (group with section comments as needed).
2. Blank line.
3. All `NEXT_PUBLIC_*` keys.

Files that are only `NEXT_PUBLIC_*` or only server keys need no extra ordering.

## References

- [.cursor/rules/env-file-formatting.mdc](../../.cursor/rules/env-file-formatting.mdc)
- [AGENTS.md](../../AGENTS.md) — env templates and local overrides
