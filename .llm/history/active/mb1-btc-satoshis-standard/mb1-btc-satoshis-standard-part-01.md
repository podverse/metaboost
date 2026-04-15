### Session 1 - 2026-04-14

#### Prompt (Developer)

MB1 BTC + Optional Satoshis Standard

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Standardized MB1 currency constants to canonical `BTC` and `USD`, and canonical satoshi unit to `satoshis`.
- Updated UI amount rendering normalization to be case-insensitive for BTC/satoshis while preserving unknown fallback display as one concatenated amount string.
- Updated MB1 schema validation to accept case-insensitive `currency`, constrain to BTC/USD, and enforce optional-but-if-present BTC amount unit as `satoshis` (case-insensitive input, canonical lowercase output).
- Added explicit currency/unit normalization in MB1 controller persistence path so stored/output values are canonical.
- Updated MB1 OpenAPI schema to document canonical BTC/USD and optional BTC satoshis behavior.
- Updated MB1 contract tests to verify canonicalization and case-insensitive acceptance, and replaced prior `sats` expectations with `satoshis`.

#### Files Modified

- .llm/history/active/mb1-btc-satoshis-standard/mb1-btc-satoshis-standard-part-01.md
- packages/helpers/src/mb1/constants.ts
- packages/helpers/src/index.ts
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/app/(main)/b/[id]/page.tsx
- apps/api/src/schemas/mb1.ts
- apps/api/src/controllers/mb1Controller.ts
- apps/api/src/openapi-mb1.ts
- apps/api/src/test/mb1-spec-contract.test.ts
