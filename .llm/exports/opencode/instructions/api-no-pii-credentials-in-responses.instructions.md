---
description: "API responses must never expose credentials or serialize req.user/req.managementUser directly. Use safe toJson helpers only."
applyTo: "**"
---

# No PII/Credentials in API Responses

When adding or changing code that sends user or admin data in API responses:

## Do

- **Main API (apps/api):** Use `userToJson(user)` for the **authenticated user only** (login, me, signup, refresh, confirm-email-change, update-profile). Use `userToPublicSummary(user)` for any **other** user (e.g. bucket admins list/detail) so email is never returned for other users while username/displayName are available for identity in UI lists/details. See [apps/api/src/lib/userToJson.ts](apps/api/src/lib/userToJson.ts).
- **Management API (apps/management-api):** Use `managementUserToJson(admin)` for every response that includes a management user. Use `userToJson(user)` in usersController for main-app user data. See [apps/management-api/src/lib/managementUserToJson.ts](apps/management-api/src/lib/managementUserToJson.ts).
- Never include `passwordHash`, `credentials`, or any credential field in response bodies.

## Don't

- Never pass `req.user` or `req.managementUser` (or any entity that has `.credentials`) to `res.json()` or into response payloads. Always serialize through the safe helpers above.
- Never return email for *another* user from the main API; use `userToPublicSummary` for other users.

## Reference

- AGENTS.md § Auth and PII
- apps/management-api/src/CREDENTIALS-PROTECTION.md
