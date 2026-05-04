---
name: trust-foundation-schema-only
description: Add trust/entitlement schema foundations without enabling runtime gating. Use when creating trust-tier and per-user override tables, entities, and helper types before rollout.
---

# Trust Foundation (Schema-Only)

Use this skill when Metaboost needs trust/entitlement groundwork but must keep runtime behavior
unchanged.

## Goals

- Add DB schema for trust tiers and per-user overrides.
- Add ORM entities/relations and helper constants/types.
- Keep auth, routes, and web behavior unchanged.

## Required shape

- Trust tier integer with explicit enum semantics (for example `1=untrusted`, `2=trusted`).
- Per-user nullable override fields for booleans/limits.
- Numeric overrides constrained to non-negative values.
- Backfill existing users with default trust-tier rows.

## Do

- Add a forward-only app linear migration.
- Wire migration into ops/kustomization migration bundles.
- Update expected migration filename markers.
- Add entity registrations in ORM datasource/index exports.

## Do not

- Do not modify `apps/api/src/middleware/requireAuth.ts` for gating.
- Do not add capability checks in controllers/routes.
- Do not expose trust fields in API payloads yet.
