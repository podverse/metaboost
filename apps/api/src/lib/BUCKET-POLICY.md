# Bucket permission policy (API)

Permission checks for bucket and message CRUD. Used by controllers to enforce access.

## Module

- **`bucket-policy.ts`** — Sync helpers: `(userId, bucket, bucketAdmin)` or `(userId, bucket, bucketAdmin, message)`.
- Policy: owner has full access; bucket admins use `bucketCrud` and `bucketMessagesCrud` bitmasks (see `@boilerplate/helpers` CRUD_BITS: create=1, read=2, update=4, delete=8).

## Helpers and call sites

| Helper                | Call site(s)                                        |
| --------------------- | --------------------------------------------------- |
| canReadBucket         | bucketsController (getBucket, listChildBuckets)     |
| canCreateBucket       | bucketsController (createChildBucket)               |
| canUpdateBucket       | bucketsController (updateBucket)                    |
| canDeleteBucket       | bucketsController (deleteBucket)                    |
| canManageBucketAdmins | bucketAdminsController                              |
| canManageBucketRoles  | bucketRolesController                               |
| canReadMessage        | bucketMessagesController (getMessage, listMessages) |
| canCreateMessage      | bucketMessagesController (createMessage)            |
| canUpdateMessage      | bucketMessagesController (updateMessage)            |
| canDeleteMessage      | bucketMessagesController (deleteMessage)            |

## Implementation

- **Bucket CRUD** and **manage admins/roles** use an internal `makeCanBucketCrud(bit)` factory.
- **Message CRUD** (except read) use `makeCanMessageCrud(bit)`; **canReadMessage** is custom (checks `message.isPublic` first).
- Behavior is unchanged from the previous explicit per-function implementation.

## Alignment with web

The web app uses `apps/web/src/lib/bucket-authz.ts`, which fetches the viewer’s bucket admin via the API and then applies the same CRUD bit checks. Terminology and bits match this module.
