# Plan 08: Wire `brand_name` into Metaboost web component t() calls

## Scope

After the i18n originals are updated (plan 07), every component that calls `t()` with one of the modified keys must pass `{ brand_name }` as an interpolation parameter.

## How brand_name is accessed in Metaboost web

In the Metaboost web app, the brand name is available from the layout level:

```typescript
// In layout.tsx:
const runtimeConfig = getRuntimeConfig();
const brandName = runtimeConfig.env.NEXT_PUBLIC_WEB_BRAND_NAME ?? 'metaboost-web';
```

Or via the config helper:

```typescript
import { getWebBrandName } from '../config/env';
const brandName = getWebBrandName();
```

For client components, `brandName` may need to be passed as a prop from the server layout, or accessed via a client-side hook/context.

## Keys that need wiring

| i18n key | Namespace | Needs `{ brand_name }` |
|----------|-----------|------------------------|
| `bucketTypeRssChannelDescription` | likely `common` or `settings` | yes |
| `verifyMetaboostEnabled` | likely `common` or `settings` | yes |
| `rssItemsEmptyNeedsVerification` | likely `settings` or `buckets` | yes |
| `deleteAccountDescription` | likely `profile` or `settings` | yes |
| `bestEffortDisclaimer` | likely `terms` or `common` | yes |
| `intro` (boostSetupInstructions) | likely nested namespace | yes |
| `step2Body` (boostSetupInstructions) | likely nested namespace | yes |
| `bucketTypeCustomDescription` | likely `common` or `settings` | yes |
| `introGeneric` | likely `terms` or `common` | yes |
| `servicePurposeBody` | likely `terms` or `common` | yes |
| `bestEffortStrong` | likely `terms` or `common` | yes |
| `refundsBody` | likely `terms` or `common` | yes |

## Steps

### 1. Find all call sites

Search `apps/web/src/` for each key name to find the component(s) that call `t()` with it.

### 2. Determine how brandName reaches each component

Options:
- **Server component**: Call `getWebBrandName()` directly or from `getRuntimeConfig()`
- **Client component**: Receive `brandName` as a prop from the parent server component, or use a context/hook

### 3. Update each t() call

```typescript
t('key', { brand_name: brandName })
```

If `brandName` is not available in the component, trace back to where it can be injected (layout, parent component, context) and thread it through.

### 4. Verify each component

After updating, confirm:
- The `t()` call includes `{ brand_name }` interpolation
- The `brandName` value is correctly sourced from the runtime config
- TypeScript compiles without errors

## Key Files (to be discovered)

Search in:
- `apps/web/src/app/**/*.tsx`
- `apps/web/src/components/**/*.tsx`

## Verification

- For each modified key, grep `apps/web/src/` to confirm t() call has `{ brand_name }`
- TypeScript compilation succeeds
- Manual check: run the web app and verify brand name renders correctly on affected pages
