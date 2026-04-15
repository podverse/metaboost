### Session 1 - 2026-04-14

#### Prompt (Developer)

instead of "unknown" when a sender name is missing, it should say "Anonymous"

#### Key Decisions

- Updated MB1 message creation so `senderName` is populated only from `sender_name`; it no longer falls back to `app_name`.
- This ensures missing sender names remain null and UI fallback text displays `Anonymous`.

#### Files Modified

- apps/api/src/controllers/mb1Controller.ts
- .llm/history/active/sender-name-anonymous-fallback/sender-name-anonymous-fallback-part-01.md
