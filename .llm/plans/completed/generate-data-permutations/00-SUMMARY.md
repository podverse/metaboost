# Generate Data Permutations Summary

## Goal

Upgrade `tools/generate-data` so it can populate high-volume, high-variation datasets that better exercise web and management-web rendering branches while remaining independent from deterministic E2E seed scripts.

## Why this plan exists

- Current bulk seeding is useful for volume, but does not comprehensively cover:
  - bucket/message/payment verification permutations
  - RSS hierarchy and metadata permutations
  - role/admin/invitation permutations
  - management permission personas
- Deterministic E2E seeding is separate and must not be regressed.

## Plan files

- `01-schema-and-entity-alignment.md`
- `02-main-db-permutation-seeding.md`
- `03-management-db-permutation-seeding.md`
- `04-cli-config-and-ops-guardrails.md`
- `05-verification-and-docs.md`

## Non-goals

- No changes to deterministic E2E seed entrypoints:
  - `tools/web/seed-e2e.mjs`
  - `tools/management-web/seed-e2e.mjs`
- No test assertion rewrites outside generate-data validation coverage.

## Dependency map

- `01` must finish first (schema/entity parity baseline).
- `02` and `03` can run in parallel after `01`.
- `04` depends on `02` and `03`.
- `05` depends on all prior files.

## Success criteria

- `generate-data` can produce both:
  - high-volume random data (`rows`-driven), and
  - curated permutation packs (explicit scenario toggles).
- Seed output covers all currently modeled bucket/message/payment/RSS/admin dimensions needed for UI inspection.
- E2E deterministic flow remains untouched and passing.
