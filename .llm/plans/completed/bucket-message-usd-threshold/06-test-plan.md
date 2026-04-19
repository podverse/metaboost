# 06 - Test Plan

## Scope
Define required automated coverage for the threshold feature across API and UI surfaces.

## Integration Tests (API/Management-API)
1. Message creation persistence:
   - BTC and USD payloads persist expected `usd_cents_at_create` snapshot.
   - Non-convertible/rate-unavailable path persists `null` (if intentionally supported).
2. Bucket settings:
   - Update/get bucket includes `minimumMessageUsdCents`.
   - Validation for integer range and invalid inputs.
3. List filtering behavior:
   - Bucket list endpoints respect root threshold baseline.
   - Optional query minimum tightens results (`max` behavior).
   - Public standard list endpoints apply identical filtering basis.
4. Edge behavior:
   - Null snapshot rows excluded when effective min > 0.
   - Pagination totals remain coherent with filtering.

## E2E Tests (web and management-web)
1. Bucket settings UI:
   - Top-level settings can set/update minimum threshold.
2. Bucket messages visibility:
   - Message list reflects threshold filtering behavior after save.
3. Optional query parameter behavior:
   - URL/request-level minimum further narrows visible messages where supported by UI flow.

## Suggested Test File Targets
- `apps/api/src/test/*.test.ts` (bucket/message list and standard endpoint coverage)
- `apps/management-api/src/test/*.test.ts` (bucket list/settings coverage)
- `apps/web/e2e/*.spec.ts` (bucket settings + messages)
- `apps/management-web/e2e/*.spec.ts` (bucket settings + messages)

## Verification Commands (for later execution by user)
```bash
make e2e_test_web_report_spec SPEC=e2e/<target-web-spec>.spec.ts
make e2e_test_management_web_report_spec SPEC=e2e/<target-management-spec>.spec.ts
```
