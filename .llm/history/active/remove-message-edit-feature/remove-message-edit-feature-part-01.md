### Session 1 - 2026-04-14

#### Prompt (Developer)

Remove Message Edit Feature Everywhere

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Removed message-row edit affordances from shared UI by deleting edit href support from `BucketMessageList` and `BucketMessagesPageContent`; message rows now expose delete-only actions in management views.
- Restricted `BucketMessageService.update` to verification-only updates by removing support for `body` and `isPublic` mutation fields.
- Kept MB1 confirmation flow unchanged since it already updates verification-related fields only.
- Added API contract regression coverage to assert confirm-payment updates verification while preserving existing message body/public fields.
- Verified touched workspaces pass lint (`@metaboost/ui`, `@metaboost/orm`, `@metaboost/api`).

#### Files Modified

- packages/ui/src/components/bucket/BucketMessageList/BucketMessageList.tsx
- packages/ui/src/components/bucket/BucketMessagesPageContent/BucketMessagesPageContent.tsx
- packages/orm/src/services/BucketMessageService.ts
- apps/api/src/test/mb1-spec-contract.test.ts
- .llm/history/active/remove-message-edit-feature/remove-message-edit-feature-part-01.md
