### Session 1 - 2026-04-14

#### Prompt (Developer)

Fix Currency/Unit Canonicalization and Fallback Display

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Updated generate-data message value seeding so satoshi-denominated values are canonical (`currency: BTC`, `amountUnit: satoshis`), removing `SAT`/`sat` literals.
- Added canonical rendering helpers in private/public bucket message pages to:
  - render BTC + satoshi-like units as `satoshis`,
  - render BTC non-satoshi units as `Bitcoin`,
  - render USD as `$X.XX`,
  - fallback unknown currency/unit as one concatenated amount string (`amount + currency + amountUnit`).
- Added compatibility normalization for legacy short satoshi forms without emitting abbreviated output.
- Verified targeted implementation paths contain no `SAT` / `sat` / `sats` literals and pass lint diagnostics.

#### Files Modified

- .llm/history/active/canonical-bitcoin-satoshis/canonical-bitcoin-satoshis-part-01.md
- tools/generate-data/src/main/seed.ts
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/app/(main)/b/[id]/page.tsx
