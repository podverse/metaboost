# 03 - Metaboost API Confirm-Payment and Filters

## Scope

Implement confirm-payment recipient outcome ingestion and hierarchical filtering behavior.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/controllers/mb1Controller.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/controllers/bucketMessagesController.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/schemas/mb1.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/api/src/openapi-mb1.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/helpers-requests/src/types/bucket-types.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/helpers-requests/src/web/buckets.ts`

## Steps

1. Expand confirm-payment schema body to include recipient outcomes and optional metadata.
2. Implement server-side verification-level derivation:
   - determine largest recipient from value split data in payload
   - calculate final level based on Phase 1 rules
3. Persist both derived level and recipient summary/details in message record.
4. Preserve idempotency for repeated confirm calls on same `message_guid`.
5. Replace binary list filtering with threshold-based filtering in:
   - MB1 public list endpoints
   - authenticated bucket messages endpoints
6. Set default threshold to `verified-largest-recipient-succeeded`.
7. Add include flags to allow lower thresholds:
   - include partially verified
   - include not verified
8. Update API response DTOs so clients can render:
   - verification level
   - summary counters
   - recipient details payload for expand panels.

## Backward compatibility handling

- For legacy records with missing recipient details, return consistent derived summaries.
- Maintain current authorization/policy checks unchanged.

## Verification

- Integration tests for confirm-payment produce all 4 levels correctly.
- Public endpoints return only default-threshold records by default.
- Owner/admin include flags correctly widen result sets.
