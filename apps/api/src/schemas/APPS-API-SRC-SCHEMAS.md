# API validation schemas

All request-body and query validation for the main API lives in this directory. Schemas are Joi-based; controllers and routes import them from here and do not define schemas inline.

| File         | Purpose                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| `auth.ts`    | Login, signup, forgot-password, reset-password, change-password, update-profile, confirm-email-change |
| `buckets.ts` | Buckets (create, update, child), bucket admins, admin invitations, roles, messages, public submit     |

Consumers import from specific files (e.g. `../schemas/buckets.js`, `../schemas/auth.js`).
