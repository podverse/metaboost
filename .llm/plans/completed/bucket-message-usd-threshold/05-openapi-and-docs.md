# 05 - OpenAPI and Docs

## Scope
Document new threshold fields and query parameters in API contracts.

## Steps
1. Update OpenAPI for bucket settings:
   - Add `minimumMessageUsdCents` in bucket schemas/examples.
2. Update OpenAPI for list endpoints:
   - Add optional `minimumAmountUsdCents` query parameter for relevant list routes.
3. Ensure descriptions explicitly state cent units and USD conversion basis.
4. Align any endpoint docs currently mismatched with implementation pagination fields where touched.
5. Update any feature docs that describe bucket settings/message visibility behavior.

## Key Files
- `apps/api/src/openapi.ts` (or split OpenAPI modules, if present)
- `apps/management-api/src/openapi.ts`
- `docs/*` files covering bucket settings or standard message endpoint filtering

## Verification
- OpenAPI generation/build remains valid.
- New fields/params are discoverable in docs and examples.
- Terminology is consistent: USD cents, create-time snapshot, optional request minimum.
