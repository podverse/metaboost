# 05 Testing And Rollout

## Scope

Define safe rollout, migration order, and post-deploy validation for terms lifecycle changes.

## Key Files

- [docs/development/TERMS-LIFECYCLE-RUNBOOK.md](docs/development/TERMS-LIFECYCLE-RUNBOOK.md)
- [apps/api/src/test/auth.test.ts](apps/api/src/test/auth.test.ts)
- [apps/web/e2e](apps/web/e2e)
- [apps/management-web/e2e](apps/management-web/e2e)

## Steps

1. Update runbook to include:
   - DB-backed terms content ownership process.
   - management-web workflow replacing direct SQL for normal operations.
   - emergency SQL fallback for severe incidents.
2. Rollout sequence:
   - deploy DB migration first,
   - then API + management-api + web + management-web changes,
   - then create first `upcoming` terms version via management-web.
3. Add comprehensive automated coverage:
   - API integration tests for phase transitions and acceptance target resolution.
   - Web E2E for persistent banner and dual `/terms` rendering.
   - Management-web E2E for scheduling/admin transitions.
4. Add smoke test checklist for production:
   - exactly one `current`
   - at most one `upcoming`
   - acceptance by a test user clears banner and updates `/terms` state.

## Rollback Strategy

- For hard-break status migration issues, rollback means restoring from DB backup/snapshot and redeploying the previous release.
- Do not keep runtime compatibility branches for old status conventions.
