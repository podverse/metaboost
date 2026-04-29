# Linear Migrations CI and Docs Reference Alignment Checklist (05C)

Date: 2026-04-28
Phase: 05c-linear-ci-validation-and-docs

## Scope

- CI validation and status messaging for linear migrations and generated baseline artifacts.
- Migration process docs and contributor-facing process guidance aligned to canonical forward-only paths.
- Related Cursor guidance where migration CI/process rules are defined.

## Checklist

- [x] CI workflow runs `validate-linear-migrations.sh`.
- [x] CI workflow runs `verify-linear-baseline.sh`.
- [x] CI workflow keeps db init sync validation (`make check_k8s_postgres_init_sync`).
- [x] CI db init uses canonical linear migration SQL paths under `infra/k8s/base/ops/source/database/linear-migrations/`.
- [x] CI status comments distinguish migration validation, baseline verification, and init-sync checks.
- [x] Migration docs reference only canonical linear migration paths.
- [x] AGENTS migration/test setup references canonical linear migration paths.
- [x] Cursor linear migration skill references canonical path model without legacy mirror guidance.

## Verification Notes

- `./scripts/nix/with-env bash scripts/database/validate-linear-migrations.sh` passed.
- `./scripts/nix/with-env bash scripts/database/verify-linear-baseline.sh` passed.

## Intentional Divergences

- No dedicated `docs/development/CONTRIBUTING.md` exists in this repository. Contributor-facing migration/process guidance is maintained in `AGENTS.md` and `docs/development/DB-MIGRATIONS.md` for this phase.
