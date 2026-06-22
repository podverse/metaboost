# 02 — Align `ci.yml` gates

## Scope

Reconcile MetaBoost `ci.yml` with Podverse CI intent while keeping MetaBoost test ports (5632/6579)
and dual-database env.

## Podverse gates MetaBoost should adopt

| Gate | Podverse | MetaBoost today |
| --- | --- | --- |
| OpenAPI check | `OpenAPI check` step | **Missing** — add if MB publishes OpenAPI (see `swagger-openapi` skill) |
| `make check_k8s_postgres_init_sync` | present | MB has `Validate db init sync` — verify equivalent |
| npm ci retry loop | 5 attempts | **Missing** in CI — add |
| Linear baseline step naming | `db-baseline-0003` | MB uses `Verify generated linear baseline artifacts` — ALIGN naming/docs only |

## MetaBoost extras (KEEP)

- GHA `services:` postgres/valkey (Podverse uses docker pull — both valid; **KEEP** MB approach unless flaky)
- `i18n validate`, `Type-check` steps if not in Podverse CI — **KEEP** if valuable
- MetaBoost-specific DB role env vars

## Steps

1. Diff full `ci.yml` files side-by-side.
2. Add npm ci retry pattern from Podverse to install step.
3. Add OpenAPI check step if applicable to MetaBoost API surface.
4. Ensure no changelog/export references remain.

## Verification

```bash
grep -n "OpenAPI\|npm ci failed" .github/workflows/ci.yml
```
