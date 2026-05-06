# env-expiration-naming

**Started:** 2026-05-04  
**Author:** Cursor Agent  

---

### Session 1 - 2026-05-04

#### Prompt (Developer)

DEFAULT_FREE_TRIAL_EXPIRATION_SECONDS

this is the wrong convention we want _EXPIRATION to end env and js variable names, not have a denomination afterward. _EXPIRATION env vars should always be seconds so we can infer that. if you don't have skills that already inform you for this standard then add them

#### Key Decisions

- Renamed **`DEFAULT_FREE_TRIAL_EXPIRATION_SECONDS`** → **`DEFAULT_FREE_TRIAL_EXPIRATION`** across helpers, orm `freeTrialExpirationSeconds.ts`, management-web create-user defaults; renamed helper `parsePositiveIntegerTrialSeconds` → **`parsePositiveIntegerTrialExpiration`** with `fallbackExpiration` param.
- Added **`.cursor/skills/env-expiration-naming/SKILL.md`** and **`.cursor/rules/env-expiration-naming.mdc`**.

#### Files Created/Modified

- `packages/helpers/src/membership/membershipProductDefaultsFromEnv.ts`
- `packages/helpers/src/index.ts`
- `packages/orm/src/lib/freeTrialExpirationSeconds.ts`
- `apps/management-web/src/lib/createUserFormDefaults.ts`
- `.cursor/skills/env-expiration-naming/SKILL.md`
- `.cursor/rules/env-expiration-naming.mdc`
