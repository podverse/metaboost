### Session 1 - 2026-04-14

#### Prompt (Developer)

Message Details and Seed Data Scope

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Updated generate-data recipient outcomes so `name` is present most of the time and `customKey`/`customValue` are occasionally populated together as a coherent pair.
- Removed duplicate amount/app metadata from expanded value details and moved app name into top-level message metadata presentation.
- Expanded verification details to include per-recipient rows (address, status, split, fee, optional name/custom).
- Refactored shared MessageCard layout to show amount + app name on the left and verification status on the right above body text, with a single bottom details toggle that swaps label text and caret direction.
- Strengthened partially-verified warning emphasis with a higher-contrast warning badge style.
- Ran full repo lint/type-check pipeline (`./scripts/nix/with-env npm run lint -- --max-warnings=0`) successfully.

#### Files Modified

- tools/generate-data/src/main/seed.ts
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/app/(main)/b/[id]/page.tsx
- packages/ui/src/components/bucket/BucketMessageList/BucketMessageList.tsx
- packages/ui/src/components/bucket/MessageCard/MessageCard.tsx
- packages/ui/src/components/bucket/MessageCard/MessageCard.module.scss
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- .llm/history/active/message-details-seed-realism/message-details-seed-realism-part-01.md
