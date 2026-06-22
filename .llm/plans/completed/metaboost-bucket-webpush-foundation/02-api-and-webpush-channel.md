# 02 - API and Webpush Channel (Metaboost)

## Scope

- Expose authenticated endpoints for preference and subscription lifecycle.
- Add channel-aware notification orchestration with Web Push as first channel.
- Trigger notifications on new bucket messages with threshold-aware gating.

## Steps

1. Add bucket notification preference endpoints.
   - Read current user preference for a bucket.
   - Update preference for a bucket.
   - Support applyToDescendants for preference update.
2. Add Web Push device endpoints (account-scoped pattern aligned with Podverse).
   - Create, update, delete, list-all-for-account.
3. Add Joi schemas and helpers-requests request/response types for all new endpoints.
4. Add notification orchestrator abstraction.
   - Channel-neutral service switch (future mobile push compatible).
   - Web Push channel implementation using VAPID-backed web-push admin setup.
5. Hook dispatch into message creation flows.
   - mb-v1 and mbrss-v1 boost create paths.
   - Dispatch should be non-blocking relative to message persistence response.
6. Apply threshold behavior for send eligibility.
   - Use root/effective minimum threshold logic and existing threshold snapshot values.
   - Only send notifications for qualifying messages.

## Key files

- apps/api/src/routes/buckets.ts
- apps/api/src/routes/auth.ts
- apps/api/src/controllers/bucketsController.ts
- apps/api/src/controllers/mbV1Controller.ts
- apps/api/src/controllers/mbrssV1Controller.ts
- apps/api/src/lib/standardIngest/persistBoostMessage.ts
- apps/api/src/lib/message-threshold-filter.ts
- apps/api/src/schemas/buckets.ts
- packages/helpers-requests/src/web/buckets.ts

## Exit criteria

- API can persist and query per-user bucket preferences and webpush subscriptions.
- Notifications are dispatched on new messages through orchestrator + webpush channel.
- Threshold filtering is enforced for notification sending.