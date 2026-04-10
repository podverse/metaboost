# Management API validation schemas

All request-body and query validation for the management API lives in this directory. Schemas are Joi-based; controllers and routes import them from here and do not define schemas inline.

| File          | Purpose                                                            |
| ------------- | ------------------------------------------------------------------ |
| `auth.ts`     | Login, change-password, update-profile                             |
| `admins.ts`   | Management admins (create, update, change-password), admin roles   |
| `buckets.ts`  | Buckets (create, update, child), bucket admins, invitations, roles |
| `events.ts`   | Event log list query (limit, offset)                               |
| `messages.ts` | Bucket messages (create, update)                                   |
| `users.ts`    | Main-app users (create, update, change-password)                   |

Consumers import from specific files (e.g. `../schemas/buckets.js`, `../schemas/auth.js`).
