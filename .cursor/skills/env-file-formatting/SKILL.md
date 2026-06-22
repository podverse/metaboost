---
name: env-file-formatting
description: Env file value formatting — double quotes for Node/Docker .env; unquoted values for
  K8s source/*.env. Use when adding or editing .env, .env.example, or env templates.
---

# Env file formatting

## When to use

When adding or editing env var files. **Which rules apply depends on the file path** (see below).

## Node / Docker env files

Applies to app `.env` / `.env.example`, `infra/config/env-templates/*.env.example`,
`infra/config/local/*.env`, and `dev/env-overrides/local/*.env.example`.

- **Non-empty values**: Double quotes (e.g. `API_PORT="3000"`, `DATABASE_HOST="localhost"`).
- **Empty/unset**: no value after `=` (e.g. `OPTIONAL_VAR=`).

See [.cursor/rules/env-file-formatting.mdc](/.cursor/rules/env-file-formatting.mdc) for examples.

## K8s ConfigMap `source/*.env`

Applies to `infra/k8s/**/source/*.env` (and GitOps overlay copies) consumed by `configMapGenerator`.

- **Values are unquoted** (kustomize env-file semantics).
- **Numbers are unquoted**: `DB_PORT=5432`, not `DB_PORT="5432"`.
- **Empty/unset**: `KEY=`.
- **Comments**: at most **one** env var name per `#` line.

Keep keys aligned with `infra/config/env-templates/*.env.example`. See also
[infra/k8s/INFRA-K8S-BASE.md](/infra/k8s/INFRA-K8S-BASE.md).

For **K8s YAML manifest** value types (string vs numeric OpenAPI fields), see **k8s** skill — not
this skill.

## Variable order when mixing server and `NEXT_PUBLIC_*`

If a file defines both keys that are **not** `NEXT_PUBLIC_*` (e.g. `API_PORT`, `READINESS_*`,
`NODE_ENV`, `RUNTIME_CONFIG_*`) **and** any `NEXT_PUBLIC_*`:

1. All non-`NEXT_PUBLIC_*` assignments first (group with section comments as needed).
2. Blank line.
3. All `NEXT_PUBLIC_*` keys.

Files that are only `NEXT_PUBLIC_*` or only server keys need no extra ordering.

## References

- [.cursor/rules/env-file-formatting.mdc](/.cursor/rules/env-file-formatting.mdc)
- [.cursor/skills/k8s/SKILL.md](/.cursor/skills/k8s/SKILL.md) — K8s YAML string vs numeric typing
- [AGENTS.md](/AGENTS.md) — env templates and local overrides
