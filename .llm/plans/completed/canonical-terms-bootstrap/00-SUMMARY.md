# Canonical default `terms_version` bootstrap

## Problem

- Legacy `0008_seed_local_terms_version.sql` under `postgres-init/` was mounted **only** in local Docker Compose (removed in favor of linear migrations).
- K8s postgres-init ConfigMaps ([`/infra/k8s/base/db/kustomization.yaml`](/infra/k8s/base/db/kustomization.yaml)) use the current linear-migration bundle.
- A clean production cluster therefore creates schema but **no** `terms_version` row; [`TermsVersionService.assertConfiguredForStartup()`](/packages/orm/src/services/TermsVersionService.ts) prevents API/management-api from starting until operators manually seed terms.

## Goal

- Ship a **single, canonical** SQL bootstrap that inserts one default **`active`** `terms_version` row, included in **the same postgres-init bundle** used by K8s and by local Docker.
- Keep **local-only** seeds (e.g. `localdev@example.com`) as optional Compose-only mounts, separate from this canonical row.
- After implementation, **remove duplication** (drop Docker-only `0008` terms seed in favor of the canonical file).

## Decisions

- **Neutral bootstrap row:** version_key/title/content_hash are placeholders; real legal lifecycle continues to be managed via migrations / operator process / `terms_version` tables.
- **Timestamps:** align default `effective_at` / `enforcement_starts_at` with documented [`API_LATEST_TERMS_EFFECTIVE_AT`](/apps/api/src/lib/startup/validation.ts) expectations (same baseline as current `0008`, e.g. `2026-01-01` UTC), unless product chooses a different canonical date—document the choice in the SQL comment.
- **Filename / ordering:** add as **`0007_*`** in canonical `postgres-init/` so K8s runs it immediately after `0006`. Renumber **local user** seed from `0007_seed_local_user.sql` → **`0008_seed_local_user.sql`** so lexicographic order stays: canonical terms first, then local dev user.

## Plan files

| File | Contents |
|------|-----------|
| [01-infra-canonical-bootstrap.md](./01-infra-canonical-bootstrap.md) | SQL file, K8s ConfigMaps, Docker Compose, docs, verification |
| [COPY-PASTA.md](./COPY-PASTA.md) | Single implementation prompt |

## Dependencies

- None blocking; complements existing startup gate and local `0008` terms seed.
