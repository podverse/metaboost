# Phase 1: Data model and ORM

- Added SQL tables:
  - `bucket_blocked_app` (`root_bucket_id`, `app_id`, `app_name_snapshot`)
  - `global_blocked_app` (`app_id`, `note`)
- Added ORM entities:
  - `BucketBlockedApp`
  - `GlobalBlockedApp`
- Added ORM services:
  - `BucketBlockedAppService`
  - `GlobalBlockedAppService`
- Registered entities in `packages/orm/src/data-source.ts`.
- Exported entities/services in `packages/orm/src/index.ts`.
