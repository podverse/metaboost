# Plan 10: Compile and validate Metaboost i18n

## Scope

After all i18n originals and overrides are updated (plans 07, 09), run the Metaboost i18n toolchain to sync, compile, and validate.

## Steps

### 1. Sync originals from en-US

```bash
npm run i18n:sync
```

This adds any missing keys from en-US to other locale originals (es.json) with empty string values. Since we're removing the `appTitle` key from en-US, sync should remove it from es.json too — but verify this manually.

### 2. Compile originals + overrides into compiled/

```bash
npm run i18n:compile
```

This merges originals + overrides into the compiled JSON files used at runtime.

### 3. Validate key parity

```bash
npm run i18n:validate
```

This checks:
- All locale files have the same keys as en-US
- Key order matches en-US
- en-US has no empty values
- Non-en-US originals may have empty values (pending translation)

### 4. Verify appTitle removal

Confirm that `appTitle` is gone from all originals, overrides, and compiled files:

```bash
grep -r "appTitle" apps/web/i18n/ apps/management-web/i18n/
```

Should return zero matches.

### 5. Verify brand_name interpolation

Confirm that all keys that were changed now have `{brand_name}` in their values:

```bash
grep -r "brand_name" apps/web/i18n/originals/ apps/management-web/i18n/originals/
```

Should show the expected keys.

### 6. Check compiled output

Verify compiled files were regenerated correctly:

```bash
ls -la apps/web/i18n/compiled/ apps/management-web/i18n/compiled/
```

Files should have updated timestamps.

## Key Files

- `apps/web/i18n/compiled/en-US.json`
- `apps/web/i18n/compiled/es.json`
- `apps/management-web/i18n/compiled/en-US.json`
- `apps/management-web/i18n/compiled/es.json`

## Verification

- `npm run i18n:validate` passes with no errors
- No `appTitle` key in any i18n file
- All `{brand_name}` interpolations present in originals
- Compiled files are up-to-date
