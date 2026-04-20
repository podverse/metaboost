# Metaboost Blocked Apps Implementation Summary

## Goal

Implement default-allow app posting controls with:

- root-bucket blocked apps (inherited by descendants),
- site-wide blocked app overrides (management-admin controlled),
- unsigned pre-check support via `app_id`,
- POST enforcement via verified AppAssertion `iss`.

## Delivered areas

- DB schema + ORM entities/services for `bucket_blocked_app` and `global_blocked_app`.
- API policy enforcement (`app_registry_blocked` -> `app_global_blocked` -> `app_bucket_blocked`).
- Bucket-level blocked-app CRUD + registry-backed app listing endpoint.
- Web bucket settings blocked-app checklist UI with disabled global/registry-blocked state tooltip.
- Management API + management-web controls for global app blocks.
- OpenAPI, i18n, and integration test coverage updates.
