# Terms Lifecycle Runbook

This runbook defines the operational workflow for `terms_version` lifecycle management.

## Roles and approvals

- **Author**: drafts new terms metadata and verifies content hash/version key.
- **Operator**: executes SQL changes in production after approval.
- **Reviewer**: validates schedule windows, active-version uniqueness, and rollback readiness.

All production changes require at least author + reviewer approval before execution.

## Lifecycle states

- `draft`: not visible to policy evaluation.
- `scheduled`: queued for activation with known `effective_at` and `enforcement_starts_at`.
- `active`: current enforceable terms version (exactly one row globally).
- `retired`: historical version no longer active.

## Standard lifecycle flow

1. Create a draft row with final `version_key`, `title`, and `content_hash`.
2. Set scheduling windows (`announcement_starts_at`, `effective_at`, `enforcement_starts_at`) and move to `scheduled`.
3. At activation time, within a transaction:
   - set current `active` row to `retired`
   - set target `scheduled` row to `active`
4. Verify:
   - exactly one `active` row
   - target row timestamps are intact
   - auth payload reports the expected `currentTermsVersionKey`

## Controlled SQL surface (fallback)

```sql
BEGIN;

-- Step 1: retire currently-active version.
UPDATE terms_version
SET status = 'retired', updated_at = NOW()
WHERE status = 'active';

-- Step 2: activate scheduled version by version_key.
UPDATE terms_version
SET status = 'active', updated_at = NOW()
WHERE version_key = :target_version_key;

COMMIT;
```

## Emergency rollback

1. Identify previous version key (most recent `retired` that should be restored).
2. Run the same transactional swap:
   - current `active` -> `retired`
   - chosen prior `retired` -> `active`
3. Validate:
   - one `active` row exists
   - `/auth/me` reflects restored `currentTermsVersionKey`
   - blocked standard-endpoint behavior matches expected enforcement state

## Post-change checklist

- `SELECT version_key, status, effective_at, enforcement_starts_at FROM terms_version ORDER BY updated_at DESC;`
- Confirm no duplicate `active` rows (partial unique index should enforce this).
- Confirm terms-required gating behavior in web for a non-accepted test account.
