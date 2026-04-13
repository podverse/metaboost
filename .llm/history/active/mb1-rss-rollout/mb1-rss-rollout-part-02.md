### Session 11 - 2026-04-13

#### Prompt (Developer)

@metaboost/apps/web/src/app/(main)/how-to/creators/page.tsx:1-53 this should use i18n

#### Key Decisions

- Convert the creators how-to page to use server-side `next-intl` translations.
- Add a dedicated `howToCreators` translation namespace in `en-US` and `es` originals.
- Keep route/link behavior unchanged while localizing all page copy.
- Add a scoped public how-to E2E spec to keep coverage aligned with unauthenticated page behavior.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/web/src/app/(main)/how-to/creators/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/web/e2e/how-to-pages-public.spec.ts

### Session 12 - 2026-04-13

#### Prompt (Developer)

@metaboost/apps/api/src/config/index.ts:98-99 this should not be a "mb1" specific terms of service
url. it should be a "messagesTermsOfServiceUrl"

#### Key Decisions

- Rename the API config key to `messagesTermsOfServiceUrl` so the concept is not MB1-specific.
- Rename the env variable to `API_MESSAGES_TERMS_OF_SERVICE_URL` across runtime config, startup validation, test setup, and env classification/docs.
- Keep MB1 capability response field name unchanged (`terms_of_service_url`) while sourcing it from the generic config key.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/api/src/config/index.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/lib/startup/validation.ts
- apps/api/src/test/setup.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- apps/api/.env
- infra/env/classification/base.yaml
- infra/env/overrides/remote-k8s.yaml
- docs/MB1-SPEC-CONTRACT.md
- docs/development/ENV-REFERENCE.md

### Session 13 - 2026-04-13

#### Prompt (Developer)

For the code present, we get this error:
```
Type '`API ${string}`' is not assignable to type '\"API v1\"'.
```
Fix it, verify, and then give a concise explanation. @metaboost/apps/api/src/lib/api-docs.ts:17-20

#### Key Decisions

- Widen `ApiDocsBundle` `servers` typing so runtime-configured server descriptions (`API ${config.apiVersionPath}`) are valid.
- Keep OpenAPI document structure unchanged; only relax overly narrow literal typing caused by `as const`.
- Verify with focused API TypeScript type-check.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/api/src/lib/api-docs.ts

### Session 14 - 2026-04-13

#### Prompt (Developer)

@metaboost/apps/web/src/app/(main)/how-to/developers/page.tsx:1-53 this should use i18n

#### Key Decisions

- Convert the developers how-to page to server-side `next-intl` translations.
- Add a dedicated `howToDevelopers` translation namespace in `en-US` and `es` originals.
- Keep existing route/link behavior unchanged while localizing all page copy.

#### Files Modified

- .llm/history/active/mb1-rss-rollout/mb1-rss-rollout-part-02.md
- apps/web/src/app/(main)/how-to/developers/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
