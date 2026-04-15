### Session 1 - 2026-04-15

#### Prompt (Developer)

Streamline Message Amount Display

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Keep the default message card metadata to one amount line and move expanded metadata under a single generic details disclosure with grouped sections.
- Enforce UI amount formatting rules for web/private and web/public pages: BTC -> Bitcoin, BTC sats -> satoshis, USD -> `$X.XX`.
- Preserve management-web compatibility by adopting the new grouped-details contract there for verification details without introducing unsupported value fields.

#### Files Modified

- .llm/history/active/message-amount-display-streamline/message-amount-display-streamline-part-01.md
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/app/(main)/b/[id]/page.tsx
- apps/web/i18n/originals/en-US.json
- apps/web/i18n/originals/es.json
- apps/management-web/src/app/(main)/bucket/[id]/page.tsx
- apps/management-web/i18n/originals/en-US.json
- apps/management-web/i18n/originals/es.json
- packages/ui/src/components/bucket/BucketMessageList/BucketMessageList.tsx
- packages/ui/src/components/bucket/MessageCard/MessageCard.tsx
- packages/ui/src/components/bucket/MessageCard/MessageCard.module.scss
