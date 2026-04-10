# Credentials protection (management-api)

Same approach as the main API: **never expose credentials in responses or logs**. The management-api is admin-only; it may return PII (e.g. main-app user email) for user management and in event audit details. Credentials (passwordHash, etc.) must still never appear in responses.

## Rules

1. **Single serialization path**
   - **Management users (admins/super admin):** Use `managementUserToJson()` from `lib/managementUserToJson.js` for every response that includes a management user. Never pass `req.managementUser` or any object that includes `credentials` (e.g. `passwordHash`) to `res.json()`.
   - **Main-app users:** Use `userToJson()` in `controllers/usersController.ts` for every response that includes a main-app user. Never pass a user object that includes `credentials`/`passwordHash` to `res.json()`.
   - **Events:** Use `eventToJson()` in `controllers/eventsController.ts`; events do not contain credentials.

2. **What must not appear in responses**
   - `passwordHash` (management or main-app)
   - Raw passwords
   - Full `credentials` or `user.credentials` / `admin.credentials` objects
   - Verification token hashes or raw tokens (if added later)

3. **Error messages**
   - Use generic messages (e.g. "Invalid credentials") so responses do not reveal whether email or password was wrong.
   - Do not echo request body (e.g. password) in error messages or logs.

4. **Middleware**
   - `requireManagementAuth` attaches the full management user to `req.managementUser`. Handlers must never serialize that object; they must use `managementUserToJson()` (or `userToJson()` for main users) when sending user/admin data in a response.

## Where serialization happens

| Response type   | Use this                     | File / export                                |
| --------------- | ---------------------------- | -------------------------------------------- |
| Management user | `managementUserToJson(user)` | `lib/managementUserToJson.ts`                |
| Main-app user   | `userToJson(user)`           | `controllers/usersController.ts` (internal)  |
| Audit event     | `eventToJson(e)`             | `controllers/eventsController.ts` (internal) |
