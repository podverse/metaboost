# Plan 06: Add `WEB_BRAND_DOMAIN` env var to Metaboost

## Scope

Add a new `WEB_BRAND_DOMAIN` environment variable to the Metaboost classification and runtime config pipeline. This holds the public-facing domain (e.g. `metaboost.cc`) for future use in i18n interpolation.

Note: No hardcoded domain references were found in Metaboost i18n files currently, but adding this env var now ensures consistency with the Podverse approach and supports future white-labeling.

## Steps

### 1. Add to classification base.yaml

**`infra/env/classification/base.yaml`** — Add `WEB_BRAND_DOMAIN` under the `info.vars` section (after `MANAGEMENT_WEB_BRAND_NAME`):

```yaml
WEB_BRAND_DOMAIN:
  kind: literal
  default: "metaboost.cc"
  override_file: info
```

### 2. Propagate via inheritance maps

In the same file, add to the inheritance maps:

**`web-sidecar` inherits from `info`:**
```yaml
- from: info
  map:
    WEB_BRAND_NAME: NEXT_PUBLIC_WEB_BRAND_NAME
    LEGAL_NAME: NEXT_PUBLIC_LEGAL_NAME
    WEB_BRAND_DOMAIN: NEXT_PUBLIC_WEB_BRAND_DOMAIN   # ADD THIS
```

**`management-web-sidecar` inherits from `info`:**
```yaml
- from: info
  map:
    MANAGEMENT_WEB_BRAND_NAME: NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_NAME
    WEB_BRAND_DOMAIN: NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN   # ADD THIS
```

### 3. Add to web runtime config

**`apps/web/src/config/runtime-config.ts`** — Add to `WebRuntimeConfigEnvKey` union:
```typescript
| 'NEXT_PUBLIC_WEB_BRAND_DOMAIN'
```

**`apps/web/src/config/runtime-config-store.ts`** — Add to the build fallback env object:
```typescript
NEXT_PUBLIC_WEB_BRAND_DOMAIN: process.env.NEXT_PUBLIC_WEB_BRAND_DOMAIN,
```

**`apps/web/src/config/env.ts`** — Add helper function:
```typescript
/** NEXT_PUBLIC_WEB_BRAND_DOMAIN (public-facing domain, e.g. metaboost.cc). */
export function getWebBrandDomain(): string | undefined {
  return env('NEXT_PUBLIC_WEB_BRAND_DOMAIN')?.trim() || undefined;
}
```

### 4. Add to management-web runtime config

Same pattern for `apps/management-web/src/config/`:

**`apps/management-web/src/config/runtime-config.ts`** — Add:
```typescript
| 'NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN'
```

**`apps/management-web/src/config/runtime-config-store.ts`** — Add to build fallback:
```typescript
NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN: process.env.NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN,
```

**`apps/management-web/src/config/env.ts`** — Add helper:
```typescript
export function getManagementWebBrandDomain(): string | undefined {
  return env('NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN')?.trim() || undefined;
}
```

## Key Files

- `infra/env/classification/base.yaml`
- `apps/web/src/config/runtime-config.ts`
- `apps/web/src/config/runtime-config-store.ts`
- `apps/web/src/config/env.ts`
- `apps/management-web/src/config/runtime-config.ts`
- `apps/management-web/src/config/runtime-config-store.ts`
- `apps/management-web/src/config/env.ts`

## Verification

- Grep for `NEXT_PUBLIC_WEB_BRAND_DOMAIN` in web config files — confirm present
- Grep for `NEXT_PUBLIC_MANAGEMENT_WEB_BRAND_DOMAIN` in management-web config files — confirm present
- Grep for `WEB_BRAND_DOMAIN` in `base.yaml` — confirm in info.vars and both sidecar inheritance maps
- Run `scripts/env-classification/render.rb` (or the local env setup) to confirm no errors
