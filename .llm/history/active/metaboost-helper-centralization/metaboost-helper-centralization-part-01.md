### Session 1 - 2026-04-19

#### Prompt (Developer)

Metaboost Helper Centralization Plan

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Started with a repo-wide helper inventory and duplicate detection before edits.
- Prioritized low-risk extractions first (numeric guard, shared cookie parsing/browser checks, shared link path parsing), then cross-app dedupes, then auth mode alignment.
- Centralized truly generic helpers into `@metaboost/helpers`, but kept endpoint/page-specific mapping helpers local to avoid abstraction churn.

#### Files Modified

- .llm/history/active/metaboost-helper-centralization/metaboost-helper-centralization-part-01.md
- packages/ui/src/lib/isClient.ts
- packages/ui/src/lib/cookieJson.ts
- packages/ui/src/components/table/tableListStateCookie.ts
- packages/ui/src/components/table/bucketDetailNavCookie.ts
- packages/ui/src/components/table/sortPrefsCookie.ts
- .llm/history/active/metaboost-helper-centralization/kept-local-rationale.md
- packages/helpers/src/number/isFinitePositive.ts
- packages/helpers/src/query/parseFilterColumns.ts
- packages/helpers/src/url/normalizeBaseUrl.ts
- packages/helpers/src/auth/auth-mode-capabilities.ts
- packages/helpers/src/index.ts
- apps/api/src/lib/exchangeRates.ts
- apps/api/src/config/standardEndpointRegistry.ts
- apps/api/src/lib/parsePageLimit.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/api/src/config/index.ts
- apps/management-api/src/lib/registryApps.ts
- apps/management-api/src/config/index.ts
- apps/web/src/lib/server-request.ts
- apps/management-web/src/lib/parseFilterColumns.ts
- packages/ui/src/lib/cookieJson.ts
- packages/ui/src/lib/navigationPath.ts

### Session 3 - 2026-04-19

#### Prompt (Developer)

@metaboost/packages/ui/src/lib/cookieJson.ts:1-3 it seems like isClient would make sense in a different file than cookieJson

#### Key Decisions

- Split `isClient` out of `cookieJson` into a separate UI lib helper module.

#### Files Modified

- .llm/history/active/metaboost-helper-centralization/metaboost-helper-centralization-part-01.md
- packages/ui/src/components/table/tableListStateCookie.ts
- packages/ui/src/components/table/bucketDetailNavCookie.ts
- packages/ui/src/components/table/sortPrefsCookie.ts
- packages/ui/src/components/navigation/Link/Link.tsx
- packages/ui/src/components/form/ButtonLink/ButtonLink.tsx

### Session 2 - 2026-04-19

#### Prompt (Developer)

@metaboost/packages/ui/src/components/form/ButtonLink/ButtonLink.tsx:10 it seems like these helpers may belong in a more generic package than ui since this logic could be used somewhere outside of a ui context

#### Key Decisions

- Move navigation/path helpers from `@metaboost/ui` into `@metaboost/helpers` so they are reusable across non-UI packages.
- Keep helper names stable (`isInternalHref`, `normalizePath`, `pathnameFromHref`) while only changing their canonical package location.
- Fix strict typing in `packages/ui/src/lib/cookieJson.ts` with a record type guard discovered during type-check validation.

#### Files Modified

- .llm/history/active/metaboost-helper-centralization/metaboost-helper-centralization-part-01.md
- packages/helpers/src/url/navigationPath.ts
- packages/helpers/src/index.ts
- packages/ui/src/components/form/ButtonLink/ButtonLink.tsx
- packages/ui/src/components/navigation/Link/Link.tsx
- packages/ui/src/lib/cookieJson.ts
- packages/ui/src/lib/navigationPath.ts
