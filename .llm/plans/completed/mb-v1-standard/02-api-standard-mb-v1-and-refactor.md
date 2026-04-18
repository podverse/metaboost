# mb-v1 standard API

- `apps/api/src/lib/standardIngest/` — shared currency normalize + message create.
- `mbV1Controller.ts`, `schemas/mbV1.ts`, `openapi-mbV1.ts`, `routes/mbV1.ts`.
- `standardEndpoint.ts`, `api-docs.ts` — register `/mb-v1` and Swagger.
- `mbrssV1Controller.ts` — use shared helpers where duplicated.
