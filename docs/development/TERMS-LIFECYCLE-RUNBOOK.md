# Terms Lifecycle Runbook

This runbook defines the operational workflow for `terms_version` lifecycle management under the hard-break lifecycle model (no legacy statuses).

## Roles and approvals

- **Author**: drafts new terms metadata and verifies content hash/version key.
- **Operator**: performs normal lifecycle actions in management-web and coordinates production rollout windows.
- **Reviewer**: validates schedule windows, lifecycle invariants, and rollback readiness.

All production changes require at least author + reviewer approval before release rollout or production lifecycle promotion.

## Terms content ownership (DB-backed, single-language)

- Terms prose is owned in `terms_version_content` (joined to `terms_version` by `terms_version_id`).
- Locales currently supported in columns:
  - `content_text_en_us`
  - `content_text_es`
- Every row must include:
  - `version_key`
  - `title`
  - `content_hash`
  - localized content in `terms_version_content`
  - `announcement_starts_at` (optional)
  - `enforcement_starts_at`
- Authoring process:
  1. Draft content in approved legal/editorial workflow.
  2. Create or update a `draft` version in management-web with metadata and both locale text fields (`content_text_en_us`, `content_text_es`). **`content_hash` is computed on save** as SHA-256 hex of `contentTextEnUs + "\n---\n" + contentTextEs` (same algorithm as startup bootstrap).
  3. Reviewer confirms stored hash and schedule metadata before lifecycle changes.

## Lifecycle states

- `draft`: not visible to policy evaluation.
- `upcoming`: pending terms version users can pre-accept before enforcement.
- `current`: enforceable terms version (exactly one row globally).
- `deprecated`: historical version no longer rendered as active terms.

Hard constraints:

- Exactly one `current` row.
- At most one `upcoming` row.
- No runtime compatibility with legacy statuses (`scheduled`, `active`, `retired`).

## Standard lifecycle flow (management-web first)

1. Create a `draft` terms version in management-web (`/terms-versions/new`) with complete metadata and content.
2. Schedule the draft as `upcoming` (management-web action or edit status).
3. During the announcement window (before enforcement):
   - users may pre-accept `upcoming`,
   - web shows reminder banner and `/terms` dual-state rendering where applicable.
4. At promotion time, use management-web promote action on the `upcoming` version:
   - target `upcoming` -> `current`,
   - previous `current` -> `deprecated` (transactional in management-api).
5. Verify:
   - exactly one `current`,
   - at most one `upcoming`,
   - promoted row timestamps and content are intact,
   - `/auth/me` reflects expected `currentTerms`, `upcomingTerms`, and acceptance flags.

## Rollout sequence (release operations)

1. Apply database schema first (normal process only):
   - use the repo’s Postgres init / combined migration output (e.g. `infra/k8s/base/db/postgres-init/` as regenerated from `scripts/database/combine-migrations.sh`),
   - schema must include `terms_version`, `terms_version_content` (both locale columns), lifecycle check constraint, and partial unique indexes for exactly one `current` and at most one `upcoming`.
   - there is no separate one-off SQL migration script for terms; empty databases rely on app startup to insert the first default `terms_version` + `terms_version_content` rows when the table is empty.
2. Deploy app services in the same release window:
   - `api`
   - `management-api`
   - `web`
   - `management-web`
3. After deploy, create the first post-migration `upcoming` terms version in management-web.
4. Validate smoke checklist before announcing schedule externally.

## Automated coverage inventory

- API integration (`apps/api/src/test/auth.test.ts`):
  - terms acceptance target resolution for current vs upcoming,
  - auth payload terms lifecycle fields and policy flags.
- Web E2E (`apps/web/e2e`):
  - persistent terms reminder behavior during acceptance-required flow,
  - `/terms` page unauthenticated and account-specific rendering paths.
- Management-web E2E (`apps/management-web/e2e`):
  - create upcoming terms when no upcoming exists,
  - block second upcoming creation with clear error,
  - promote upcoming -> current with prior current -> deprecated,
  - forbidden and unauthenticated access matrix.

## Controlled SQL surface (fallback)

Use SQL only for severe incidents (management-web unavailable or data-repair emergency).

```sql
BEGIN;

-- Step 1: deprecate currently-current version.
UPDATE terms_version
SET status = 'deprecated', updated_at = NOW()
WHERE status = 'current';

-- Step 2: promote target upcoming version by version_key.
UPDATE terms_version
SET status = 'current', updated_at = NOW()
WHERE version_key = :target_version_key;

COMMIT;
```

If the target row is currently `draft`, update it to `upcoming` first, then run the transactional swap.

## Emergency rollback

For catastrophic database corruption or failed rollout (not a missing external migration script):

1. Restore from validated DB backup/snapshot.
2. Redeploy previous known-good application release.
3. Re-run rollout from migration validation.

For non-catastrophic lifecycle correction:

1. Identify previous version key (most recent `deprecated` that should be restored).
2. Run the same transactional swap:
   - current `current` -> `deprecated`
   - chosen prior `deprecated` -> `current`
3. Validate:
   - one `current` row exists
   - `/auth/me` reflects restored current terms snapshot
   - blocked standard-endpoint behavior matches expected enforcement state

Do not introduce compatibility branches for legacy lifecycle statuses.

## Post-change smoke checklist

- `SELECT version_key, status, announcement_starts_at, enforcement_starts_at FROM terms_version ORDER BY updated_at DESC;`
- `SELECT COUNT(*) FROM terms_version WHERE status = 'current';` should equal `1`.
- `SELECT COUNT(*) FROM terms_version WHERE status = 'upcoming';` should be `0` or `1`.
- Login as a test user who has not accepted upcoming terms:
  - reminder banner is visible,
  - `/terms` shows accepted/current plus upcoming where applicable.
- Accept terms as that user:
  - banner disappears,
  - `/terms` reflects updated accepted state.
