### Session 1 - 2026-04-30

#### Prompt (Developer)

Remove minimum boost amount; optional owner list filter only

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Completed remaining UI/i18n rename to `publicBoostDisplayMinimumMinor` / display-floor copy on web and management-web bucket forms and settings pages.
- Updated integration/spec docs for mb-v1/mbrss-v1 and standard endpoint guide: no capability minimum field, no ingest rejection by bucket minimum; list filter uses `max(query, publicBoostDisplayMinimumMinor)` with threshold snapshots.
- Cleaned API tests (`bucket-blocked-apps`, spec contracts, buckets tests) for renamed field; removed obsolete root minimum from blocked-apps fixture.

#### Files Modified (this session)

- apps/api/src/test/mbrss-v1-spec-contract.test.ts
- apps/api/src/test/bucket-blocked-apps.test.ts
- apps/web/src/app/(main)/buckets/BucketForm.tsx
- apps/web/src/app/(main)/bucket/[id]/settings/page.tsx
- apps/management-web/src/components/buckets/BucketForm.tsx
- apps/management-web/src/app/(main)/bucket/[id]/settings/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- apps/web/i18n/overrides/es.json
- apps/management-web/i18n/overrides/es.json
- docs/MB-V1-SPEC-CONTRACT.md
- docs/MBRSS-V1-SPEC-CONTRACT.md
- docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md
- docs/buckets/WEB-BUCKET-ADMIN-ROLE-INHERITANCE.md

### Session 2 - 2026-04-30

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/20.txt:7-394 fix

#### Key Decisions

- Root cause was **stale `dist/`** for workspace packages (`@metaboost/helpers`, `@metaboost/helpers-requests`, `@metaboost/orm`): TypeScript resolves package `types` to `dist/`, which still had `minimumMessageAmountMinor` on `BucketSettings` and old helper exports while `src/` already matched the rename.
- Fix: rebuild those packages in dependency order so local `dist/*.d.ts` matches `src/`.

#### Files Created/Modified

- (generated, gitignored) `packages/helpers/dist/**`, `packages/helpers-requests/dist/**`, `packages/orm/dist/**` via `npm run build -w …`

### Session 3 - 2026-05-01

#### Prompt (Developer)

@/Users/mitcheldowney/.cursor/projects/Users-mitcheldowney-repos-pv-podverse-ansible/terminals/20.txt:2314-5111 debug

#### Key Decisions

- E2E failures: Playwright looked for spinbutton/label `/minimum boost amount/i` after i18n renamed the control to **Public message list floor ({currency} {unit})**.
- Updated web and management-web bucket-settings E2E locators (and step copy) to `/public message list floor/i`.
- Second failure after locator fix: save used `successHref={bucketDetailRoute(...)}`, so empty RSS networks redirected from detail to `/new`. Settings saves now return to the same settings URL (`bucketSettingsRoute` for general or currency tab).
- Third failure: multi-step currency test exceeded default Playwright **10s** test timeout; added `test.setTimeout(45_000)` on the two longest bucket-settings currency tests.

#### Files Created/Modified

- apps/web/e2e/bucket-settings-bucket-owner.spec.ts
- apps/management-web/e2e/bucket-settings-super-admin-full-crud.spec.ts
- apps/web/src/app/(main)/bucket/[id]/settings/BucketSettingsContent.tsx
