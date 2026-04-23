# Plan 09: Replace "MetaBoost" in Metaboost management-web i18n + remove appTitle + wire t() calls

## Scope

1. Replace hardcoded "MetaBoost" brand name with `{brand_name}` in management-web i18n originals
2. Remove dead `appTitle` i18n key
3. Wire interpolation parameters into t() call sites

## Part A: i18n String Replacements

### Keys to update in `apps/management-web/i18n/originals/en-US.json`

| Key | Current value | New value |
|-----|---------------|-----------|
| `minimumMessageAmountMinorHelp` | `"...post to MetaBoost..."` | `"...post to {brand_name}..."` |

### Keys to update in `apps/management-web/i18n/originals/es.json`

| Key | Current value | New value |
|-----|---------------|-----------|
| `minimumMessageAmountMinorHelp` | `"...publicar en MetaBoost..."` | `"...publicar en {brand_name}..."` |

### Remove dead `appTitle` key from:

- `apps/management-web/i18n/originals/en-US.json`
- `apps/management-web/i18n/originals/es.json`
- `apps/management-web/i18n/overrides/es.json`

The actual page title is already driven by `NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME` in the layout components.

## Part B: Wire t() Call Sites

### How brand_name is accessed in management-web

```typescript
// In layout.tsx:
const runtimeConfig = getRuntimeConfig();
const brandName = runtimeConfig.env.NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME ?? 'metaboost-management-web';
```

Or via config helper:
```typescript
import { getManagementWebBrandName } from '../config/env';
```

### Steps

1. Find all call sites that use `minimumMessageAmountMinorHelp`
2. Add `{ brand_name: brandName }` to the t() call
3. If `brandName` is not available in the component, thread it through from the layout

## Files

- `apps/management-web/i18n/originals/en-US.json`
- `apps/management-web/i18n/originals/es.json`
- `apps/management-web/i18n/overrides/es.json`
- Component files using the affected key(s) (to be discovered)

## Verification

- Grep `apps/management-web/i18n/originals/en-US.json` for "MetaBoost" — should return zero matches
- Grep for `appTitle` — should return zero matches
- Grep `apps/management-web/src/` for `minimumMessageAmountMinorHelp` — confirm t() call has `{ brand_name }`
- TypeScript compilation succeeds
