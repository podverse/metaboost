# 13 - Web Public How-To Pages

## Scope

Add two concise public onboarding pages in the Metaboost web app:

- `/how-to/creators`
- `/how-to/developers`

These pages explain end-to-end process flow without overwhelming details.

## Hard-Replacement Rule

- Page copy and references should describe the current authoritative MB1 flow only.
- Do not document deprecated compatibility paths or fallback legacy routes.

## Route and Visibility Requirements

### Route Files

- `apps/web/src/app/(main)/how-to/creators/page.tsx`
- `apps/web/src/app/(main)/how-to/developers/page.tsx`

### Public Access

Update `apps/web/src/lib/routes.ts`:

- include both pages as public in path checks
- ensure unauthenticated users are not redirected to login on these routes

Keep route constants and helper functions consistent with existing route conventions.

## Content Requirements

### Creators Page (`/how-to/creators`)

Concise flow should cover:

1. choose/create bucket type for RSS workflow
2. add metaboost tag to RSS channel
3. verify metaboost enablement in app
4. understand channel vs item message behavior
5. configure public/private message visibility and share URLs

### Developers Page (`/how-to/developers`)

Concise flow should cover:

1. GET capability endpoint and read schema metadata
2. POST mb1 boost payload correctly (including optional `amount_unit`)
   - explain `action='boost'` vs `action='stream'` at a high level
3. confirm payment with follow-up endpoint
4. fetch public messages and optional scoped channel/item views
5. handle errors and message limits safely

### Content Style

- short sections and bullet steps
- minimal jargon
- links to deeper spec/API docs for advanced details
- avoid implementation internals not needed for onboarding
- include concise note on BTC+sats display semantics and nullable `amount_unit`
- include concise note that current message endpoints/pages display boost messages; stream telemetry is
  not shown in current message views

## i18n Requirements

- add translation keys in:
  - `apps/web/i18n/originals/en-US.json`
  - `apps/web/i18n/originals/es.json`
- compile i18n output using existing workflow for web app localization assets

## UI/Layout Expectations

- reuse existing public-friendly page layout patterns from web app
- keep design consistent with current typography/components
- avoid introducing custom wrappers that duplicate existing UI primitives

## E2E Coverage

Add E2E specs for:

- unauthenticated access to both `/how-to/*` pages
- no forced redirect to login
- expected links/headings visible
- expected cross-links between creator/developer guidance and relevant docs

Recommended spec file:

- `apps/web/e2e/how-to-pages-public.spec.ts`

## Dependencies

- Plan `01` and API route naming must be stable so developer page examples are accurate.
- Plan `12` matrix should include this public-pages spec as required browser coverage.
