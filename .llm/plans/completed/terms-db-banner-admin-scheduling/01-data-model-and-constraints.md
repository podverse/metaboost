# 01 Data Model And Constraints

## Scope

Add DB-backed single-language terms content and scheduling guarantees:

- Store renderable terms content in `terms_version`.
- Enforce only one actionable upcoming version.
- Replace existing status model with `draft`, `upcoming`, `current`, `deprecated` (hard break).

## Key Files

- [packages/orm/src/entities/TermsVersion.ts](packages/orm/src/entities/TermsVersion.ts)
- [packages/orm/src/services/TermsVersionService.ts](packages/orm/src/services/TermsVersionService.ts)
- [infra/k8s/base/db/postgres-init](infra/k8s/base/db/postgres-init)
- [infra/k8s/base/db/migrations](infra/k8s/base/db/migrations)

## Steps

1. Add DB column(s) to `terms_version` for renderable single-language terms body (and optional summary metadata if needed by UI).
2. Add a breaking data migration for existing rows:
   - map old statuses into the new lifecycle states.
   - fail migration/startup if rows cannot be mapped safely (no legacy fallback code paths).
3. Add DB-level uniqueness guards:
   - at most one row where `status='upcoming'`.
   - exactly one row where `status='current'`.
   - old rows transition to `deprecated` once superseded.
4. Extend ORM entity and service methods:
   - Fetch `current`, `upcoming`, and user-accepted versions efficiently.
   - Add helper(s) to resolve “actionable acceptance target” (`upcoming` when pending, else `current`) for API usage.
5. Ensure startup checks continue to require at least one current/next terms row.

## Decisions Locked

- Hard break only: no backward compatibility branches or fallback status handling.
- Database is source of truth for terms prose; remove dependence on i18n terms copy.

## Verification

- Migration applies cleanly on empty and existing DBs.
- Constraint rejects a second `upcoming` row.
- Service-level tests cover:
  - current only
  - current + one upcoming
  - invalid two upcoming rows (constraint failure path).
