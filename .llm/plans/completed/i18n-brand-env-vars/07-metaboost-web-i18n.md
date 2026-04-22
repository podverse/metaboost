# Plan 07: Replace "Metaboost"/"MetaBoost" in Metaboost web i18n + remove dead appTitle

## Scope

1. Replace all hardcoded "Metaboost"/"MetaBoost" brand name references with `{brand_name}` interpolation in `apps/web/i18n/originals/` (en-US and es)
2. Remove the dead `appTitle` i18n key

## Part A: Brand Name Replacements

### Keys to update in `apps/web/i18n/originals/en-US.json` (7 keys)

| Key | Current value | New value |
|-----|---------------|-----------|
| `bucketTypeRssChannelDescription` | `"Connect Metaboost to an RSS podcast..."` | `"Connect {brand_name} to an RSS podcast..."` |
| `verifyMetaboostEnabled` | `"Verify Metaboost Enabled"` | `"Verify {brand_name} Enabled"` |
| `rssItemsEmptyNeedsVerification` | `"...then run Verify Metaboost Enabled."` | `"...then run Verify {brand_name} Enabled."` |
| `deleteAccountDescription` | `"...no longer want to use Metaboost."` | `"...no longer want to use {brand_name}."` |
| `bestEffortDisclaimer` | `"...shown in Metaboost are..."` | `"...shown in {brand_name} are..."` |
| `intro` (boostSetupInstructions) | `"...usual setup in Metaboost."` | `"...usual setup in {brand_name}."` |
| `step2Body` (boostSetupInstructions) | `"...run Verify Metaboost Enabled so Metaboost can confirm..."` | `"...run Verify {brand_name} Enabled so {brand_name} can confirm..."` |

Note: Some keys use "Metaboost" and others "MetaBoost". Both should become `{brand_name}` — the env var determines the actual spelling.

### Keys to update in `apps/web/i18n/originals/es.json` (4 keys)

| Key | Replace |
|-----|---------|
| `verifyMetaboostEnabled` | "Metaboost" → `{brand_name}` |
| `deleteAccountDescription` | "Metaboost" → `{brand_name}` |
| `bestEffortDisclaimer` | "Metaboost" → `{brand_name}` |
| `intro` (boostSetupInstructions) | "Metaboost" → `{brand_name}` |

Note: Some keys in es.json may already be empty or have Spanish text. Only replace the brand name occurrence, not other text.

### Keys NOT to change

These keys use "Metaboost"/"MetaBoost" in a technical context (XML tag names, protocol names) and should remain as-is:

- `addToRssDescription` — references `podcast:metaBoost` XML tag
- `addToRssInstructions` — references `podcast:metaBoost` XML tag
- `minimumMessageAmountMinorHelp` — references "MetaBoost" as a posting target (this IS a brand reference, but it's in management-web — see plan 09)
- `rssItemsEmptyNeedsVerification` — the `podcast:metaBoost` tag reference should stay; only the "Verify Metaboost Enabled" text changes
- `introGeneric`, `servicePurposeBody`, `bestEffortStrong`, `refundsBody` — these reference "MetaBoost" as a brand and SHOULD be changed. Check if they exist in es.json too.

Wait — let me be more thorough. All of these should be checked:

- `bucketTypeCustomDescription` — "Create a custom MetaBoost bucket" → brand reference → CHANGE
- `addToRssDescription` — "MetaBoost value tag" → could be a protocol name, keep as-is
- `addToRssInstructions` — "metaBoost tag" → XML tag name, keep as-is
- `minimumMessageAmountMinorHelp` — "post to MetaBoost" → brand reference → CHANGE (in management-web, plan 09)
- `rssFeedUrlPlaceholder` — `https://example.com/feed.xml` → not a brand reference, keep as-is
- `rssItemsEmptyNeedsVerification` — `podcast:metaBoost` tag reference stays, but "Verify Metaboost Enabled" changes
- `step1Body` — `podcast:metaBoost` tag → keep as-is
- `step2Body` — `podcast:metaBoost` snippet stays, but "Verify Metaboost Enabled" and "Metaboost can confirm" change
- `introGeneric` — "MetaBoost message delivery" → brand reference → CHANGE
- `servicePurposeBody` — "MetaBoost is an external service" → brand reference → CHANGE
- `bestEffortStrong` — "Values shown in MetaBoost" → brand reference → CHANGE
- `refundsBody` — "MetaBoost does not issue refunds" → brand reference → CHANGE

## Part B: Remove Dead `appTitle` Key

The `appTitle` key (value `"metaboost-web"`) is defined but never used in any component code. Remove it from:

- `apps/web/i18n/originals/en-US.json`
- `apps/web/i18n/originals/es.json`
- `apps/web/i18n/overrides/es.json`

The actual page title is already driven by `NEXT_PUBLIC_WEB_BRAND_NAME` in the layout components.

## Files

- `apps/web/i18n/originals/en-US.json`
- `apps/web/i18n/originals/es.json`
- `apps/web/i18n/overrides/es.json` (remove appTitle only)

## Verification

- Grep `apps/web/i18n/originals/en-US.json` for "Metaboost" (case-insensitive) — remaining hits should only be in technical contexts (`podcast:metaBoost` XML tag references, protocol identifiers)
- Grep for `appTitle` — should return zero matches
- Run `npm run i18n:validate` to confirm key parity (do NOT run compile yet — that's plan 10)
