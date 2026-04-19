# 10 - Legacy Row Behavior and Contract Clarity

## Scope
Document and enforce consistent consumer-facing behavior for threshold filtering when legacy/non-convertible monetary rows exist, and align OpenAPI/spec docs with strict denomination and renamed threshold query semantics.

## Steps
1. Define explicit behavior contract for threshold filters (`effective minimum > 0`):
   - rows without usable threshold basis are excluded from filtered results,
   - unfiltered paths may still include those rows.
2. Update OpenAPI docs to reflect current strict denomination behavior:
   - `amount_unit` is required for supported currencies on relevant create endpoints,
   - remove optional/ambiguous wording where runtime rejects missing units.
3. Update API docs/spec contract markdown:
   - replace outdated `minimumAmountUsdCents` references with `minimumAmountMinor`,
   - state units and filtering semantics clearly (minor units, threshold basis).
4. Align management-api OpenAPI/docs with the same query naming and threshold semantics.
5. Add/refresh migration notes for consumers:
   - breaking query rename,
   - legacy row exclusion behavior under active thresholds.

## Key Files
- `apps/api/src/openapi-mbV1.ts`
- `apps/api/src/openapi-mbrssV1.ts`
- `apps/management-api/src/openapi.ts`
- `docs/MB-V1-SPEC-CONTRACT.md`
- `docs/MBRSS-V1-SPEC-CONTRACT.md`
- `docs/api/STANDARD-ENDPOINT-INTEGRATION-GUIDE.md`
- `.llm/plans/active/metaboost-bucket-currency-threshold/07-openapi-docs-env-and-k8s.md`

## Verification
- OpenAPI/docs reference `minimumAmountMinor` and no longer describe `minimumAmountUsdCents`.
- Strict `amount_unit` requiredness in docs matches runtime validation.
- Consumer docs clearly state legacy/non-convertible row behavior under threshold filters.
