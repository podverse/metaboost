# Terms DB Banner Admin Scheduling

## Objective

Implement a full terms lifecycle where:

- Terms content is served from the database (single language).
- Users can pre-accept upcoming terms before enforcement.
- A persistent banner appears below the navbar on every page for users who must accept upcoming terms.
- `/terms` can show a user-aware view (accepted current terms vs upcoming terms) and then converge to the enforced terms after grace.
- Server admins can manage/schedule terms versions from management-web.

## Confirmed Product Decisions

- Hard break from current status semantics (no backward compatibility/fallback behavior).
- Replace status model with explicit lifecycle states: `draft`, `upcoming`, `current`, `deprecated`.
- Acceptance uses one action (`accept terms`) that records whichever terms version is currently actionable for that user.
- Enforce a hard constraint that there is at most one `upcoming` terms change at a time.
- Remove i18n-backed terms prose for this feature; render DB-backed terms text only.

## Existing Foundation We Will Reuse

- Terms policy evaluation in [apps/api/src/lib/terms-policy/index.ts](apps/api/src/lib/terms-policy/index.ts).
- Terms entities/services in [packages/orm/src/entities/TermsVersion.ts](packages/orm/src/entities/TermsVersion.ts) and [packages/orm/src/services/TermsVersionService.ts](packages/orm/src/services/TermsVersionService.ts).
- Terms acceptance endpoint in [apps/api/src/controllers/authController.ts](apps/api/src/controllers/authController.ts).
- Terms gate UI in [apps/web/src/app/(main)/terms-required/TermsRequiredPageClient.tsx](apps/web/src/app/(main)/terms-required/TermsRequiredPageClient.tsx).
- Admin CRUD/table patterns in [apps/management-web/src/components/ResourceTableWithFilter.tsx](apps/management-web/src/components/ResourceTableWithFilter.tsx).

## Gap Summary

- No DB field currently stores full terms body for rendering in web.
- No management-api/management-web terms-version CRUD or scheduling UI exists.
- Current acceptance endpoint records only the active version, not upcoming version in announcement/grace.
- Current `/terms` rendering is i18n text via [apps/web/src/components/TermsOfServiceContent.tsx](apps/web/src/components/TermsOfServiceContent.tsx), not user/version aware.
- Current schema and policy logic assume old status naming (`scheduled`/`active`/`retired`) and need a breaking migration.

## Plan Files

- [00-EXECUTION-ORDER.md](00-EXECUTION-ORDER.md)
- [01-data-model-and-constraints.md](01-data-model-and-constraints.md)
- [02-api-and-management-api.md](02-api-and-management-api.md)
- [03-web-banner-and-terms-page.md](03-web-banner-and-terms-page.md)
- [04-management-web-admin-tools.md](04-management-web-admin-tools.md)
- [05-testing-and-rollout.md](05-testing-and-rollout.md)
- [COPY-PASTA.md](COPY-PASTA.md)
