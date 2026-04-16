# 01 - Spec and Data Contracts

## Scope

Define canonical MB1 verification semantics and contracts before implementation.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/docs/MB1-SPEC-CONTRACT.md`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/openapi-mb1.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/schemas/mb1.ts`

## Steps

1. Define a canonical enum for verification levels:
   - `fully-verified`
   - `verified-largest-recipient-succeeded`
   - `partially-verified`
   - `not-verified`
2. Define recipient outcome payload for legacy follow-up route (removed), including:
   - recipient identifier
   - split amount or percentage
   - success/failure/unknown status
   - optional tx metadata (id/error code/message)
3. Define server-side derivation rules from recipient outcomes to one final message level.
4. Define threshold query params and include flags:
   - default threshold: `verified-largest-recipient-succeeded`
   - optional includes for lower levels without breaking current public defaults
5. Define response field names shared by API and apps:
   - verification level
   - recipient outcome summary counts
   - optional recipient breakdown object for expanded UI details
6. Capture backward compatibility behavior:
   - legacy rows with only `payment_verified_by_app`
   - migration default mapping for legacy booleans

## Decisions to lock in this phase

- Whether level is persisted as enum text or derived from persisted recipient JSON.
- Whether legacy follow-up route (removed) accepts full recipient list every call or partial updates.
- Whether public endpoints expose recipient-level details or only summary.

## Verification

- OpenAPI examples cover all 4 verification levels.
- Schema validation examples include:
  - largest recipient succeeded with mixed outcomes
  - largest recipient failed with partial successes
  - all failed/no confirmation
