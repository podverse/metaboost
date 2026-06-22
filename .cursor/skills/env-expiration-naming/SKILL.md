---
name: env-expiration-naming
description: >-
  Naming for env keys and TypeScript symbols that represent time-until-expiration or duration until
  expiry. Use when adding or renaming MEMBERSHIP_FREE_TRIAL_EXPIRATION, JWT expiration env, or similar.
---

# Env and code: `*_EXPIRATION` naming

## Rule

- **Env keys** and **exported JS/TS constant names** that represent an expiration-related duration end with **`_EXPIRATION`** — not `_EXPIRATION_SECONDS`, `_SECONDS`, or other unit suffixes after `_EXPIRATION`.
- For these names, **values are always in seconds**. Do not encode “seconds” again in the identifier; `_EXPIRATION` implies the unit.

## Do

- Env (membership bootstrap): `MEMBERSHIP_FREE_TRIAL_EXPIRATION`, plus premium list prices
  `MEMBERSHIP_PREMIUM_COST_MONTHLY` / `MEMBERSHIP_PREMIUM_COST_ANNUALLY` (USD; non-expiration keys).
- Env (JWT / tokens): management JWT expiration env vars documented with seconds.
- Constants: `DEFAULT_FREE_TRIAL_EXPIRATION` (number of seconds when unset).

## Don’t

- `DEFAULT_FREE_TRIAL_EXPIRATION_SECONDS`
- Duplicating the unit in the symbol name when `_EXPIRATION` already denotes “seconds duration.”

## Related

- `@metaboost/helpers` `membership/productMembershipDefaultsFromEnv.ts` uses `DEFAULT_FREE_TRIAL_EXPIRATION`.
