# i18n locale sweep (Podverse + Metaboost)

**Started:** 2026-05-04

## Session 1 - 2026-05-04

#### Prompt (Developer)

sweep through the i18n files for podverse and metaboost. make sure they are up to date and fully translated

#### Key Decisions

- **Metaboost `apps/management-web`:** Synced `es` originals/overrides with `en-US` key order for `common.userForm` (`passwordInviteHint`, `premiumBillingCadence*` strings). Spanish strings present in originals; overrides hold empty placeholders for those keys.

#### Files Created/Modified

- `apps/management-web/i18n/originals/es.json` (verified complete after root `i18n:sync`)
- `apps/management-web/i18n/overrides/es.json`
