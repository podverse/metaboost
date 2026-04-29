# Deprecated Legacy SQL Path

SQL is no longer maintained in `infra/database/`.

Canonical postgres init SQL now lives in:

- `infra/k8s/base/db/source/0003_app_schema.sql`
- `infra/k8s/base/db/source/0005_management_schema.sql.frag`

This directory is kept only as a deprecated placeholder to avoid stale path assumptions.
