# 01 - Cross-app error boundaries to `@metaboost/ui`

## Scope

Replace ~250 lines of duplicated client code in
[apps/web/src/app/error.tsx](/apps/web/src/app/error.tsx),
[apps/web/src/app/global-error.tsx](/apps/web/src/app/global-error.tsx),
[apps/management-web/src/app/error.tsx](/apps/management-web/src/app/error.tsx),
and
[apps/management-web/src/app/global-error.tsx](/apps/management-web/src/app/global-error.tsx)
with shared components in `@metaboost/ui`. The two `error.tsx` files are
byte-identical today; the two `global-error.tsx` files differ only by a
`SETTINGS_COOKIE_NAME` constant.

This aligns with the `app-local-ui-wrappers` rule and the `reusable-components`
and `ui-component-promotion` skills.

## Steps

1. **Create `AppErrorBoundary` in `packages/ui`.**
   - Path: `packages/ui/src/components/feedback/AppErrorBoundary/AppErrorBoundary.tsx`.
   - Pure presentational client component; takes localized strings + `error`,
     `reset`, `onReload`, `onGoHome` props.
   - SCSS module `AppErrorBoundary.module.scss` for the action row, dev-only
     `<details>` block, and pre-formatted error spacing - no inline `style={{}}`.
     Use `@metaboost/ui` design tokens per `styles-source-of-truth`.
   - No `next-intl` import here; copy is fully prop-driven per `shared-ui-i18n`.

2. **Create `GlobalErrorBoundary` in `packages/ui`.**
   - Path: `packages/ui/src/components/feedback/GlobalErrorBoundary/GlobalErrorBoundary.tsx`.
   - Renders `<html><body><ThemeWrapper settingsCookieName={...}>...` shell.
   - Accepts: `settingsCookieName`, `loadStrings: () => Promise<Record<string,string>>`,
     `defaultStrings`, `error`, `reset`, optional `onReload` (defaults to
     `window.location.reload`).
   - Move `isPlainRecord`, `filterErrorStrings`, and the `useEffect`/state pattern
     here. Apps inject the locale-specific `i18n/originals/<locale>.json` import
     via `loadStrings`, since dynamic imports must remain in the app to keep
     Webpack bundling local.
   - SCSS module instead of inline styles.

3. **Add Storybook stories** for both components per `storybook-component-docs`,
   covering: default state, dev-mode `details` open, all-strings-fallback path
   (so we exercise `defaultStrings`).

4. **Export from `packages/ui/src/index.ts`** and update
   [packages/ui/PACKAGES-UI.md](/packages/ui/PACKAGES-UI.md) feedback section.

5. **Replace app files with thin wrappers.**
   - `apps/web/src/app/error.tsx` and `apps/management-web/src/app/error.tsx`:
     `'use client'` + `useTranslations('errors')` + `<AppErrorBoundary ...t-prop bag />`.
     Drop inline styles and the duplicated layout entirely.
   - `apps/web/src/app/global-error.tsx`: pass `settingsCookieName="web-settings"`
     and a `loadStrings` callback that does the dynamic
     `import('../../i18n/originals/<locale>.json')`.
   - `apps/management-web/src/app/global-error.tsx`: same but
     `settingsCookieName="management-settings"`.

6. **Leave i18n keys unchanged.** The `errors.boundary_title`, `errors.global_title`,
   etc. keys already exist in both apps' `i18n/originals/en-US.json` and `es.json`.

## Key files

- `packages/ui/src/components/feedback/AppErrorBoundary/` (new)
- `packages/ui/src/components/feedback/GlobalErrorBoundary/` (new)
- `packages/ui/src/index.ts`
- `packages/ui/PACKAGES-UI.md`
- `apps/web/src/app/error.tsx`, `apps/web/src/app/global-error.tsx`
- `apps/management-web/src/app/error.tsx`, `apps/management-web/src/app/global-error.tsx`

## Tests

- Unit (Vitest in `packages/ui`): render `AppErrorBoundary` with all props,
  assert dev-mode `details` is shown only when `NODE_ENV === 'development'`,
  assert all three buttons fire their callbacks.
- Storybook visual review covers the global shell.
- Existing E2E redirect/auth specs keep passing; no spec change needed unless
  one currently asserts `data-testid="error-page"` (verify and preserve).

## Verification

```bash
make e2e_test_report_scoped WEB_SPEC=e2e/dashboard-bucket-owner.spec.ts MGMT_SPEC=e2e/dashboard-super-admin-full-crud.spec.ts
```

Pick one cross-app pair that exercises the standard layout shell so the new
shared component is rendered in both apps.
