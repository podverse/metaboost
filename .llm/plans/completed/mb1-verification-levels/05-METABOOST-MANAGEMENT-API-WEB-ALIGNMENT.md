# 05 - Metaboost Management API and Web Alignment

## Scope

Align management-api and management-web with new verification levels and filtering semantics.

## Key files

- `/Users/mitcheldowney/repos/pv/metaboost/apps/management-api/src/controllers/bucketMessagesController.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/management-api/src/lib/messageToJson.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/packages/helpers-requests/src/management-web/bucketMessages.ts`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/management-web/src/app/(main)/bucket/[id]/page.tsx`
- `/Users/mitcheldowney/repos/pv/metaboost/apps/management-web/src/app/(main)/bucket/[id]/BucketMessagesPanel.tsx`

## Steps

1. Add verification fields to management-api message JSON serializer.
2. Add threshold/include query support to management-api list endpoint.
3. Extend management-web request types and fetch params for new filters.
4. Add 4-state status indicator rendering in management message rows/cards.
5. Add expand details region mirroring web app behavior.
6. Add filter controls in management-web with role-appropriate visibility.
7. Keep current authz rules and resource permission checks unchanged.

## Alignment constraints

- Status labels and icon semantics should match web for consistency.
- Query parameter naming should match web and main API.
- Default threshold should match public/default contract:
  `verified-largest-recipient-succeeded`.

## Verification

- Management message lists show correct states for seeded scenarios.
- Filter controls produce the same hierarchical behavior as web.
- No PII or credential-sensitive fields are exposed in message payloads.
