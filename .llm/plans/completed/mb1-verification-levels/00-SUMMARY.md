# MB1 Verification Levels Rollout

## Goal

Implement hierarchical MB1 payment verification levels across Metaboost and Podverse so:

- Confirm-payment can report per-recipient outcomes in a single batch.
- Verification logic supports largest-recipient-first semantics.
- Default reads use `verified-largest-recipient-succeeded` threshold.
- UI communicates all verification states clearly with expandable details.

## Verification level model

Highest to lowest:

1. `fully-verified`
2. `verified-largest-recipient-succeeded`
3. `partially-verified`
4. `not-verified`

Threshold query behavior is inclusive upward:

- `threshold=fully-verified` => `fully-verified` only
- `threshold=verified-largest-recipient-succeeded` => levels 1-2
- `threshold=partially-verified` => levels 1-3
- `threshold=not-verified` => levels 1-4 (all)

## Status rules

- **fully-verified:** all recipients in the app-reported split succeeded.
- **verified-largest-recipient-succeeded:** largest split recipient succeeded, but at least one
  non-largest recipient failed or is unknown.
- **partially-verified:** one or more recipients succeeded, but the largest recipient failed.
- **not-verified:** all recipients failed, no recipients confirmed, or no confirmation posted.

## Repositories in scope

- Metaboost: API, management-api, web, management-web, shared UI, shared request helpers, docs.
- Podverse: sender/confirm signaling paths that call MB1 confirm-payment.

## Plan files

- `00-EXECUTION-ORDER.md`
- `01-SPEC-AND-DATA-CONTRACTS.md`
- `02-METABOOST-DB-AND-ORM.md`
- `03-METABOOST-API-CONFIRM-PAYMENT-AND-FILTERS.md`
- `04-METABOOST-WEB-STATUS-ICONS-FILTERS-EXPAND.md`
- `05-METABOOST-MANAGEMENT-API-WEB-ALIGNMENT.md`
- `06-PODVERSE-INTEGRATION-AND-SIGNALING.md`
- `07-TESTS-AND-ROLLBACK.md`
- `COPY-PASTA.md`

## Dependencies

- Contract first: spec + OpenAPI + schema decisions must be finalized before DB/API/UI code.
- DB/API before UI: state storage and filter params must exist before web and management-web work.
- Podverse integration starts after Metaboost confirm-payment contract is stable.
- Full test matrix runs after all tracks complete.
