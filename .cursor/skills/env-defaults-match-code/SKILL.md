---
name: env-defaults-match-code
description: Env vars with code fallbacks must show the default in .env.example and K8s env files. Use when adding or editing env vars that have fallback values in code.
---

# Env defaults match code

## When to use

When adding or editing environment variables that have fallback defaults in code (e.g.
`readOptionalPositiveExpirationEnv('MEMBERSHIP_FREE_TRIAL_EXPIRATION', 2678400)` or helpers that
treat unset as a documented default).

**Exception:** App `config/index.ts` modules must **not** use `||` / `??` fallbacks — see
**config-type-safety** rule. This skill applies to documented helper defaults and template parity,
not to hiding missing required config.

## Rules

- **Non-empty defaults**: If code has a fallback value, the `.env.example` and K8s `source/*.env`
  templates must include that default value — not an empty string unless unset is intentional.
  - Example: `DEFAULT_FREE_TRIAL_EXPIRATION` / `MEMBERSHIP_FREE_TRIAL_EXPIRATION="2678400"` in
    templates when helpers default to 31 days.
  - Example: boolean env read as `process.env.FOO === 'true'` (default false) →
    `.env.example` should show `FOO="false"` when documenting the default.

- **Empty is intentional**: Only leave an env var empty (`KEY=`) when the "unset" state IS the
  intended default (e.g. `LOG_DIR=` means console-only, optional mailer keys when signup mode
  does not require mail).

- **Conflicts — fix the right side**: When the code fallback differs from what's already
  consistently set in env files:
  - If all env files agree on a value and the code fallback is different, fix the code.
  - If the code fallback is the established behavior and env files are inconsistent, fix the env files.
  - Use **env-file-formatting** for formatting rules (double quotes in Node templates; unquoted in
    K8s `source/*.env`).

## Applies to

- `apps/*/.env.example` and `apps/*/sidecar/.env.example`
- `infra/config/env-templates/*.env.example`
- `infra/k8s/base/*/source/*.env` files
- `dev/env-overrides/local/*.env.example` (via home override stubs)

## References

- [env-file-formatting](/.cursor/skills/env-file-formatting/SKILL.md)
- [env-expiration-naming](/.cursor/skills/env-expiration-naming/SKILL.md) — `*_EXPIRATION` keys
- [ENV-REFERENCE.md](/docs/development/env/ENV-REFERENCE.md)
- [AGENTS.md](/AGENTS.md) — project-wide conventions
