# API rate limiting

The main API (`apps/api`) applies rate limits to selected auth endpoints to reduce brute-force,
credential stuffing, and signup/verification spam. Limits are per IP and use in-memory store by
default (single instance); a Valkey-backed store can be used for multi-instance deployments.

## Limited endpoints

| Tier     | Default     | Endpoints                                                                                                                                               |
| -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict   | 10 / 15 min | POST /auth/login, /auth/signup, /auth/forgot-password, /auth/reset-password, /auth/verify-email, /auth/request-email-change, /auth/confirm-email-change |
| Moderate | 30 / 15 min | POST /auth/change-password                                                                                                                              |

**Not limited:** GET /auth/me, POST /auth/logout, POST /auth/refresh, and all non-auth routes.

## Response when limited

- **Status:** 429 Too Many Requests
- **Body:** `{ "message": "Too many requests. Please try again later." }`
- **Headers:** `RateLimit-*` (and `Retry-After` when supported by the middleware)

Limits are hardcoded (not configurable via env). Rate limit logic lives in
`@boilerplate/helpers-backend-api` so it can be reused by management-api or other APIs if needed.
