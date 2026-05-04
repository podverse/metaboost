# Username-only User Creation and Login

Started: 2026-05-03
Author: Agent
Context: Verify that regular user login accepts username or email for users that have any combination of username/email; backend already permits username-only user creation without password.

---

### Session 1 - 2026-05-03

#### Prompt (Developer)

i don't think we want this as a requirement in podverse or metaboost when a user with a username and without an email address is created.

also, make sure podverse and metaboost will work for logging in with the various combinations

- username only
- email only
- has both username and email

the login form should work whether the user types in the username or the email if it aligns with what is expected matches a row

#### Prompt (Agent)

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself.

To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

#### Key Decisions

- Backend already allows username-only no-password creation at `apps/management-api/src/controllers/usersController.ts` (no equivalent of the podverse `requiresEmailAtInviteCompletion` gate). No code change needed.
- Regular user login (`apps/web` -> `apps/api`) already accepts either username or email via `UserService.findByEmailOrUsername` in `apps/api/src/controllers/authController.ts`. No code change needed.
- Added explicit identifier-combination coverage at the API integration layer: a new "POST /auth/login (identifier combinations)" describe block in `apps/api/src/test/auth-username.test.ts` exercises (a) login by email for an email-only account, (b) login by username for a username-only account, and (c) login by either email or username for an account with both identifiers.
- Added a "both username and email + no password -> setPasswordLink" management-api integration case to complement the existing username-only / email-only create-user tests.
- Skipped adding a new web E2E spec for login identifier combinations: the deterministic web E2E seed (`tools/web/seed-e2e.mjs`) only seeds users with email; introducing a username-only seeded user has wider implications and the API integration coverage already exercises all three combos against the real DB and login endpoint.
- Out of scope: Metaboost management/admin login (`management_user_credentials` only has username column) - would require a schema migration to also accept email.

#### Files Modified

- `apps/api/src/test/auth-username.test.ts` - added a new `POST /auth/login (identifier combinations)` describe block covering email-only, username-only, and both-identifier accounts.
- `apps/management-api/src/test/management-api.test.ts` - added a `POST /users creates user with both email and username and no password returns setPasswordLink` case.

#### Files Created

- `.llm/history/active/username-only-user-creation/username-only-user-creation-part-01.md`
