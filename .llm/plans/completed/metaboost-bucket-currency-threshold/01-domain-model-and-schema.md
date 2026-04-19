# 01 - Domain Model and Schema

## Scope
Define and persist new bucket-level currency settings and threshold semantics that are not USD-bound.

## Steps
1. Replace USD-specific bucket threshold naming with generic preferred-currency threshold naming.
2. Add bucket settings fields for:
   - `preferredCurrency` (enum/string constrained to supported catalog values)
   - `minimumMessageAmountMinor` (integer minor units; default `0`)
   - explicit threshold unit semantics derived from preferred currency minor-unit metadata (no implicit fallback).
3. Ensure defaults are applied for all existing/new buckets.
4. Update ORM entities and services for read/write parity.
5. Apply clean-slate schema changes only in init SQL (`CREATE TABLE` definitions); do not include or retain any `ALTER TABLE` migration/backfill strategy or comments.
6. Introduce or reserve schema-ready constraints for strict denomination contracts used by API ingest paths (required `amount_unit` semantics handled in API/schema steps, but persisted model must support unit-safe storage).

## Key Files
- `infra/k8s/base/db/postgres-init/0003_app_schema.sql`
- `packages/orm/src/entities/BucketSettings.ts`
- `packages/orm/src/services/BucketService.ts`
- `packages/helpers/src/db/*` (constants for bounds/defaults)

## Verification
- Schema compiles and initializes cleanly.
- ORM typecheck passes with new field names.
- New bucket creation stores defaults (`minimum=0`, `preferredCurrency=server default`).
- Schema and ORM do not depend on backward-compatibility `ALTER TABLE` paths.
- Init SQL contains no migration/backfill guidance comments for legacy columns.
