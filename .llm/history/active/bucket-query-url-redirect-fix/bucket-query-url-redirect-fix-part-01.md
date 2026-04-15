### Session 1 - 2026-04-14

#### Prompt (Developer)

Fix Bucket URL Query Redirect After Restart

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Added `loginRoute(returnUrl?)` helper in web routes to centralize safe return-url handling for server redirects.
- Updated bucket detail auth redirect to preserve the full current bucket URL (including query params) when redirecting to login.
- Added a lightweight retry in `getServerUser()` for transient `/auth/me` failures (network/5xx during restart) to reduce false unauthenticated redirects on first load.
- Verified touched files are lint-clean via IDE diagnostics.

#### Files Modified

- .llm/history/active/bucket-query-url-redirect-fix/bucket-query-url-redirect-fix-part-01.md
- apps/web/src/lib/routes.ts
- apps/web/src/app/(main)/bucket/[id]/page.tsx
- apps/web/src/lib/server-auth.ts
